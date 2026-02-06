package dialog

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"charm.land/bubbles/v2/key"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"

	"github.com/docker/cagent/pkg/runtime"
	"github.com/docker/cagent/pkg/tools"
	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/components/messages"
	"github.com/docker/cagent/pkg/tui/components/tool/editfile"
	"github.com/docker/cagent/pkg/tui/core"
	"github.com/docker/cagent/pkg/tui/core/layout"
	"github.com/docker/cagent/pkg/tui/service"
	"github.com/docker/cagent/pkg/tui/styles"
	"github.com/docker/cagent/pkg/tui/types"
)

// Layout constants for tool confirmation dialog.
const (
	toolConfirmDialogWidthPercent  = 70 // Dialog width as percentage of screen
	toolConfirmDialogHeightPercent = 80 // Max dialog height as percentage of screen
	toolConfirmMinScrollHeight     = 5  // Minimum height for the scroll view
	toolConfirmEmptyLinesBefore    = 2  // Empty lines before question
	toolConfirmEmptyLinesAfter     = 1  // Empty lines after question
)

type (
	RuntimeResumeMsg struct {
		Request runtime.ResumeRequest
	}
)

// ToolConfirmationResponse represents the user's response to tool confirmation
type ToolConfirmationResponse struct {
	Response string // "approve", "reject", or "approve-session"
}

type toolConfirmationDialog struct {
	BaseDialog
	msg               *runtime.ToolCallConfirmationEvent
	keyMap            toolConfirmationKeyMap
	sessionState      *service.SessionState
	scrollView        messages.Model
	permissionPattern string // cached permission pattern for this tool call
	previewTitle      string
	previewContent    string
}

// dialogDimensions returns computed dialog width and content width.
func (d *toolConfirmationDialog) dialogDimensions() (dialogWidth, contentWidth int) {
	dialogWidth = d.Width() * toolConfirmDialogWidthPercent / 100
	contentWidth = dialogWidth - styles.DialogStyle.GetHorizontalFrameSize()
	return dialogWidth, contentWidth
}

// SetSize implements [Dialog].
func (d *toolConfirmationDialog) SetSize(width, height int) tea.Cmd {
	d.BaseDialog.SetSize(width, height)

	// Calculate dialog dimensions using helper
	_, contentWidth := d.dialogDimensions()
	maxDialogHeight := height * toolConfirmDialogHeightPercent / 100

	// Measure fixed UI elements using the same rendering as View()
	titleStyle := styles.DialogTitleStyle.Width(contentWidth)
	title := titleStyle.Render("Tool Confirmation")
	titleHeight := lipgloss.Height(title)

	separator := d.renderSeparator(contentWidth)
	separatorHeight := lipgloss.Height(separator)

	question := styles.DialogQuestionStyle.Width(contentWidth).Render("Do you want to allow this tool call?")
	questionHeight := lipgloss.Height(question)

	options := RenderHelpKeys(contentWidth, "Y", "yes", "N", "no", "T", d.alwaysAllowHelpText(), "A", "all tools")
	optionsHeight := lipgloss.Height(options)

	// Calculate available height for scroll view
	frameHeight := styles.DialogStyle.GetVerticalFrameSize()
	fixedContentHeight := titleHeight + separatorHeight + toolConfirmEmptyLinesBefore + questionHeight + toolConfirmEmptyLinesAfter + optionsHeight
	availableHeight := max(maxDialogHeight-frameHeight-fixedContentHeight, toolConfirmMinScrollHeight)
	d.scrollView.SetSize(contentWidth, availableHeight)

	return nil
}

// renderSeparator renders the separator line consistently.
func (d *toolConfirmationDialog) renderSeparator(contentWidth int) string {
	return RenderSeparator(contentWidth)
}

// alwaysAllowHelpText returns a descriptive help text for the "always allow" option.
// For shell commands, it shows the command pattern (e.g., "always allow ls*").
// For other tools, it shows "always allow <toolname>".
func (d *toolConfirmationDialog) alwaysAllowHelpText() string {
	pattern := d.permissionPattern
	toolName := d.msg.ToolCall.Function.Name

	// For shell with a command pattern, show a more descriptive label
	if toolName == "shell" {
		if _, cmdPattern, ok := strings.Cut(pattern, ":cmd="); ok {
			return "always allow " + cmdPattern
		}
	}

	return "always allow " + toolName
}

// toolConfirmationKeyMap defines key bindings for tool confirmation dialog
type toolConfirmationKeyMap struct {
	Yes      key.Binding
	No       key.Binding
	All      key.Binding
	ThisTool key.Binding
}

// defaultToolConfirmationKeyMap returns default key bindings
func defaultToolConfirmationKeyMap() toolConfirmationKeyMap {
	return toolConfirmationKeyMap{
		Yes: key.NewBinding(
			key.WithKeys("y", "Y"),
			key.WithHelp("Y", "approve"),
		),
		No: key.NewBinding(
			key.WithKeys("n", "N"),
			key.WithHelp("N", "reject"),
		),
		All: key.NewBinding(
			key.WithKeys("a", "A"),
			key.WithHelp("A", "approve all"),
		),
		ThisTool: key.NewBinding(
			key.WithKeys("t", "T"),
			key.WithHelp("T", "always allow this tool"),
		),
	}
}

// buildPermissionPattern creates a permission pattern for the tool call.
// For shell commands, it extracts the first word of the command and creates
// a pattern like "shell:cmd=ls*" to match all invocations of that command.
// For other tools, it returns just the tool name.
func buildPermissionPattern(toolCall tools.ToolCall) string {
	toolName := toolCall.Function.Name

	// For shell tool, extract the command and create a pattern
	if toolName == "shell" {
		var args struct {
			Cmd string `json:"cmd"`
		}
		if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err == nil {
			// Extract the first word (the command) from the full command string
			// e.g., "ls -la /tmp" -> "ls"
			// strings.Fields handles all whitespace (space, tab, newline)
			if fields := strings.Fields(args.Cmd); len(fields) > 0 {
				// Create pattern: shell:cmd=<command>*
				// The trailing * allows matching with any arguments
				return toolName + ":cmd=" + fields[0] + "*"
			}
		}
	}

	// For other tools, just return the tool name
	return toolName
}

// NewToolConfirmationDialog creates a new tool confirmation dialog
func NewToolConfirmationDialog(msg *runtime.ToolCallConfirmationEvent, sessionState *service.SessionState) Dialog {
	// Create scrollable view with minimal initial size (will be updated in SetSize)
	scrollView := messages.NewScrollableView(1, 1, sessionState)

	// Add the tool call message to the view
	scrollView.AddOrUpdateToolCall(
		"", // agentName - empty for dialog context
		msg.ToolCall,
		msg.ToolDefinition,
		types.ToolStatusConfirmation,
	)

	// Build and cache the permission pattern for display and use
	pattern := buildPermissionPattern(msg.ToolCall)

	previewTitle, previewContent := buildWritePreview(msg.ToolCall, sessionState)

	return &toolConfirmationDialog{
		msg:               msg,
		sessionState:      sessionState,
		keyMap:            defaultToolConfirmationKeyMap(),
		scrollView:        scrollView,
		permissionPattern: pattern,
		previewTitle:      previewTitle,
		previewContent:    previewContent,
	}
}

func buildWritePreview(toolCall tools.ToolCall, sessionState *service.SessionState) (title, content string) {
	wd := ""
	if sessionState != nil {
		wd = sessionState.WorkingDir()
	}
	if wd == "" {
		return "", ""
	}

	switch toolCall.Function.Name {
	case builtin.ToolNameWriteFile:
		var args builtin.WriteFileArgs
		if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
			return "", ""
		}
		if args.Path == "" {
			return "", ""
		}

		abs := args.Path
		if !filepath.IsAbs(abs) {
			abs = filepath.Join(wd, abs)
		}

		oldBytes, err := os.ReadFile(abs)
		if err != nil {
			if errors.Is(err, os.ErrNotExist) {
				// New file preview: show content in a framed block.
				return fmt.Sprintf("Preview (new file: %s)", args.Path), args.Content
			}
			return fmt.Sprintf("Preview (write_file: %s)", args.Path), fmt.Sprintf("Could not read existing file: %v", err)
		}

		diff := editfile.RenderTextDiff(args.Path, string(oldBytes), args.Content, 120, false, types.ToolStatusConfirmation)
		return fmt.Sprintf("Preview (diff: %s)", args.Path), diff

	case builtin.ToolNameEditFile:
		var args builtin.EditFileArgs
		if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
			return "", ""
		}
		if args.Path == "" {
			return "", ""
		}

		abs := args.Path
		if !filepath.IsAbs(abs) {
			abs = filepath.Join(wd, abs)
		}

		oldBytes, err := os.ReadFile(abs)
		if err != nil {
			return fmt.Sprintf("Preview (edit_file: %s)", args.Path), fmt.Sprintf("Could not read file: %v", err)
		}

		newContent := string(oldBytes)
		for _, e := range args.Edits {
			if e.OldText == "" {
				continue
			}
			if !strings.Contains(newContent, e.OldText) {
				return fmt.Sprintf("Preview (edit_file: %s)", args.Path), "Could not preview edits: old text not found in file."
			}
			newContent = strings.Replace(newContent, e.OldText, e.NewText, 1)
		}

		diff := editfile.RenderTextDiff(args.Path, string(oldBytes), newContent, 120, false, types.ToolStatusConfirmation)
		return fmt.Sprintf("Preview (diff: %s)", args.Path), diff
	default:
		return "", ""
	}
}

// Init initializes the tool confirmation dialog
func (d *toolConfirmationDialog) Init() tea.Cmd {
	return d.scrollView.Init()
}

// Update handles messages for the tool confirmation dialog
func (d *toolConfirmationDialog) Update(msg tea.Msg) (layout.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		cmd := d.SetSize(msg.Width, msg.Height)
		return d, cmd

	case tea.KeyPressMsg:
		if cmd := HandleQuit(msg); cmd != nil {
			return d, cmd
		}

		switch {
		case key.Matches(msg, d.keyMap.Yes):
			return d, tea.Sequence(
				core.CmdHandler(CloseDialogMsg{}),
				core.CmdHandler(RuntimeResumeMsg{Request: runtime.ResumeApprove()}),
			)
		case key.Matches(msg, d.keyMap.No):
			// Open the rejection reason dialog on top of this dialog
			return d, core.CmdHandler(OpenDialogMsg{
				Model: NewToolRejectionReasonDialog(),
			})
		case key.Matches(msg, d.keyMap.All):
			// When --yolo-except-writes is active, "approve all" should not switch into
			// full YOLO mode (which would also auto-approve writes). Instead, treat it
			// like "approve this call" and keep future write confirmations enabled.
			if d.sessionState.YoloExceptWrites() {
				return d, tea.Sequence(
					core.CmdHandler(CloseDialogMsg{}),
					core.CmdHandler(RuntimeResumeMsg{Request: runtime.ResumeApprove()}),
				)
			}

			d.sessionState.SetYoloMode(true)
			return d, tea.Sequence(
				core.CmdHandler(CloseDialogMsg{}),
				core.CmdHandler(RuntimeResumeMsg{Request: runtime.ResumeApproveSession()}),
			)
		case key.Matches(msg, d.keyMap.ThisTool):
			// Use the cached permission pattern
			// For shell, this creates patterns like "shell:cmd=ls*"
			return d, tea.Sequence(
				core.CmdHandler(CloseDialogMsg{}),
				core.CmdHandler(RuntimeResumeMsg{Request: runtime.ResumeApproveTool(d.permissionPattern)}),
			)
		}

		// Forward scrolling keys to the scroll view
		if _, isScrollKey := core.GetScrollDirection(msg); isScrollKey {
			updatedScrollView, cmd := d.scrollView.Update(msg)
			d.scrollView = updatedScrollView.(messages.Model)
			return d, cmd
		}

	case tea.MouseWheelMsg:
		// Forward mouse wheel events to scroll view
		updatedScrollView, cmd := d.scrollView.Update(msg)
		d.scrollView = updatedScrollView.(messages.Model)
		return d, cmd
	}

	return d, nil
}

// View renders the tool confirmation dialog
func (d *toolConfirmationDialog) View() string {
	dialogWidth, contentWidth := d.dialogDimensions()

	dialogStyle := styles.DialogStyle.Width(dialogWidth)

	titleStyle := styles.DialogTitleStyle.Width(contentWidth)
	title := titleStyle.Render("Tool Confirmation")

	// Separator
	separator := d.renderSeparator(contentWidth)

	// Get scrollable tool call view
	argumentsSection := d.scrollView.View()

	// Combine all parts with proper spacing
	parts := []string{title, separator}

	if argumentsSection != "" {
		parts = append(parts, "", argumentsSection)
	}

	if d.previewContent != "" {
		parts = append(parts, "")
		parts = append(parts, styles.DialogContentStyle.Bold(true).Width(contentWidth).Render(d.previewTitle))

		parts = append(parts, styles.ToolCallResult.Render(d.previewContent))
	}

	// Confirmation prompt
	question := styles.DialogQuestionStyle.Width(contentWidth).Render("Do you want to allow this tool call?")
	allToolsLabel := "all tools"
	if d.sessionState.YoloExceptWrites() {
		allToolsLabel = "all tools (except writes)"
	}
	options := RenderHelpKeys(contentWidth, "Y", "yes", "N", "no", "T", d.alwaysAllowHelpText(), "A", allToolsLabel)

	parts = append(parts, "", question, "", options)

	content := lipgloss.JoinVertical(lipgloss.Left, parts...)

	return dialogStyle.Render(content)
}

// Position calculates the position to center the dialog
func (d *toolConfirmationDialog) Position() (row, col int) {
	dialogWidth, _ := d.dialogDimensions()
	renderedDialog := d.View()
	dialogHeight := lipgloss.Height(renderedDialog)
	return CenterPosition(d.Width(), d.Height(), dialogWidth, dialogHeight)
}
