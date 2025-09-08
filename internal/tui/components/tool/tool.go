package tool

import (
	"context"
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/v2/spinner"
	"github.com/charmbracelet/bubbles/v2/viewport"
	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/charmbracelet/glamour/v2"

	"github.com/docker/cagent/internal/app"
	"github.com/docker/cagent/internal/tui/core/layout"
	"github.com/docker/cagent/internal/tui/styles"
	"github.com/docker/cagent/internal/tui/types"
)

// toolModel implements Model
type toolModel struct {
	message  *types.Message
	renderer *glamour.TermRenderer
	width    int
	height   int
	focused  bool
	expanded bool // Whether the tool output is expanded to show full content
	spinner  spinner.Model
	app      *app.App
}

// SetSize implements Model.
func (mv *toolModel) SetSize(width, height int) tea.Cmd {
	mv.width = width
	mv.height = height
	return nil
}

// New creates a new message view
func New(msg *types.Message, a *app.App, renderer *glamour.TermRenderer) layout.Model {
	if msg.ToolCall.Function.Name == "transfer_task" {
		return &transferTaskModel{
			msg: msg,
			// renderer: renderer,
		}
	}
	return &toolModel{
		message:  msg,
		width:    80, // Default width
		height:   1,  // Will be calculated
		focused:  false,
		expanded: false, // Start collapsed
		spinner:  spinner.New(spinner.WithSpinner(spinner.Points)),
		app:      a,
		renderer: renderer,
	}
}

// Bubble Tea Model methods

// Init initializes the message view
func (mv *toolModel) Init() tea.Cmd {
	// Start spinner for empty assistant messages or pending/running tools
	if (mv.message.Type == types.MessageTypeAssistant && mv.message.Content == "") ||
		(mv.message.Type == types.MessageTypeToolCall &&
			(mv.message.ToolStatus == types.ToolStatusPending || mv.message.ToolStatus == types.ToolStatusRunning)) {
		return mv.spinner.Tick
	}
	return nil
}

// Update handles messages and updates the message view state
func (mv *toolModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyPressMsg:
		// Only handle keys when focused and the tool has completed content
		if mv.focused && (mv.message.ToolStatus == types.ToolStatusCompleted || mv.message.ToolStatus == types.ToolStatusError) && mv.message.Content != "" {
			switch msg.String() {
			case "enter", " ": // Space or Enter to toggle expansion
				mv.expanded = !mv.expanded
				return mv, nil
			case "e": // 'e' for expand
				mv.expanded = true
				return mv, nil
			case "c": // 'c' for collapse
				mv.expanded = false
				return mv, nil
			}
		}
	}

	// Handle spinner updates for empty assistant messages or pending/running tools
	if (mv.message.Type == types.MessageTypeAssistant && mv.message.Content == "") ||
		(mv.message.Type == types.MessageTypeToolCall &&
			(mv.message.ToolStatus == types.ToolStatusPending || mv.message.ToolStatus == types.ToolStatusRunning)) {
		var cmd tea.Cmd
		mv.spinner, cmd = mv.spinner.Update(msg)
		return mv, cmd
	}

	return mv, nil
}

// View renders the message view
func (mv *toolModel) View() string {
	return mv.Render(mv.width)
}

// SetFocused sets the focus state
func (mv *toolModel) SetFocused(focused bool) {
	mv.focused = focused
}

// IsFocused returns whether the model is focused
func (mv *toolModel) IsFocused() bool {
	return mv.focused
}

// Render renders the message view content
func (mv *toolModel) Render(width int) string {
	msg := mv.message

	// Ask the tool what's its display name
	team := mv.app.Team()
	agent := team.Agent(msg.Sender)
	displayName := agent.ToolDisplayName(context.TODO(), msg.ToolCall.Function.Name)
	
	// Add focus indicator
	var focusIndicator string
	if mv.focused {
		focusIndicator = styles.HighlightStyle.Render("► ")
	} else {
		focusIndicator = "  "
	}
	
	content := fmt.Sprintf("%s%s %s", focusIndicator, icon(msg.ToolStatus), styles.HighlightStyle.Render(displayName))

	if msg.ToolCall.Function.Arguments != "" {
		if msg.ToolCall.Function.Name == "search_files" {
			content += " " + render_search_files(msg.ToolCall)
		} else {
			lines := wrapLines(msg.ToolCall.Function.Arguments, mv.width-2)
			argsViewport := viewport.New(viewport.WithWidth(mv.width), viewport.WithHeight(len(lines)))
			argsViewport.SetContent(styles.MutedStyle.Render(strings.Join(lines, "\n")))
			argsViewport.GotoBottom()
			content += "\n" + argsViewport.View()
		}
	}

	// Add spinner for pending and running tools
	if msg.ToolStatus == types.ToolStatusPending || msg.ToolStatus == types.ToolStatusRunning {
		content += " " + mv.spinner.View()
	}

	// Add tool result content if available (for completed tools with content)
	var resultContent string
	if (msg.ToolStatus == types.ToolStatusCompleted || msg.ToolStatus == types.ToolStatusError) && msg.Content != "" {
		style := styles.ToolCallResultStyle

		// Calculate available width for content (accounting for padding)
		padding := style.Padding().GetHorizontalPadding()
		availableWidth := max(width-2-padding, 10) // Minimum readable width

		// Wrap long lines to fit the component width
		lines := wrapLines(msg.Content, availableWidth)

		var trimmedContent string
		var expandHint string

		if mv.expanded {
			// Show all content when expanded
			trimmedContent = strings.Join(lines, "\n")
			if mv.focused {
				expandHint = styles.MutedStyle.Render("\n[Press Enter/Space to collapse, 'c' to collapse]")
			}
		} else {
			// Show limited content when collapsed
			maxLines := 10
			if len(lines) > maxLines {
				displayLines := lines[:maxLines]
				trimmedContent = strings.Join(displayLines, "\n")
				remainingLines := len(lines) - maxLines
				
				if mv.focused {
					expandHint = styles.HighlightStyle.Render(fmt.Sprintf("\n[Press Enter/Space to expand, 'e' to expand - %d more lines hidden]", remainingLines))
				} else {
					expandHint = styles.MutedStyle.Render(fmt.Sprintf("\n... (%d more lines - select to expand)", remainingLines))
				}
			} else {
				// Content fits, no need for expansion
				trimmedContent = strings.Join(lines, "\n")
			}
		}

		if trimmedContent != "" {
			resultContent = "\n" + style.Render(trimmedContent) + expandHint
		}
	}

	return styles.BaseStyle.PaddingLeft(2).PaddingTop(1).Render(content + resultContent)
}

func icon(status types.ToolStatus) string {
	switch status {
	case types.ToolStatusPending:
		return "⊙"
	case types.ToolStatusRunning:
		return "⚙"
	case types.ToolStatusCompleted:
		return styles.SuccessStyle.Render("✓")
	case types.ToolStatusError:
		return styles.ErrorStyle.Render("✗")
	case types.ToolStatusConfirmation:
		return styles.WarningStyle.Render("?")
	default:
		return styles.WarningStyle.Render("?")
	}
}
