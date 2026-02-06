package dialog

import (
	"fmt"
	"strings"

	"charm.land/bubbles/v2/key"
	tea "charm.land/bubbletea/v2"
	"charm.land/lipgloss/v2"

	"github.com/docker/cagent/pkg/chat"
	"github.com/docker/cagent/pkg/session"
	"github.com/docker/cagent/pkg/tui/core"
	"github.com/docker/cagent/pkg/tui/core/layout"
	"github.com/docker/cagent/pkg/tui/styles"
)

// usageDialog displays token usage details for the current session.
// It shows both "Context (latest call)" and "Total (session)".
type usageDialog struct {
	BaseDialog
	session *session.Session
	keyMap  usageDialogKeyMap
}

type usageDialogKeyMap struct {
	Close key.Binding
}

func NewUsageDialog(sess *session.Session) Dialog {
	return &usageDialog{
		session: sess,
		keyMap: usageDialogKeyMap{
			Close: key.NewBinding(key.WithKeys("esc", "enter", "q"), key.WithHelp("Esc", "close")),
		},
	}
}

func (d *usageDialog) Init() tea.Cmd {
	return nil
}

func (d *usageDialog) Update(msg tea.Msg) (layout.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		cmd := d.SetSize(msg.Width, msg.Height)
		return d, cmd

	case tea.KeyPressMsg:
		switch {
		case key.Matches(msg, d.keyMap.Close):
			return d, core.CmdHandler(CloseDialogMsg{})
		}
	}
	return d, nil
}

func (d *usageDialog) dialogSize() (dialogWidth, maxHeight, contentWidth int) {
	dialogWidth = d.ComputeDialogWidth(60, 44, 72)
	maxHeight = min(d.Height()*60/100, 18)
	contentWidth = d.ContentWidth(dialogWidth, 2)
	return dialogWidth, maxHeight, contentWidth
}

func (d *usageDialog) Position() (row, col int) {
	dialogWidth, maxHeight, _ := d.dialogSize()
	return CenterPosition(d.Width(), d.Height(), dialogWidth, maxHeight)
}

func (d *usageDialog) View() string {
	dialogWidth, _, contentWidth := d.dialogSize()
	content := d.renderContent(contentWidth)
	return styles.DialogStyle.Padding(1, 2).Width(dialogWidth).Render(content)
}

type usageTotals struct {
	inputTokens  int64
	outputTokens int64
}

func (u usageTotals) totalTokens() int64 { return u.inputTokens + u.outputTokens }

func (d *usageDialog) gatherSessionTotals() (totals usageTotals, hasPerMessageData bool) {
	if d.session == nil {
		return usageTotals{}, false
	}

	// Prefer message-embedded usage (local mode) then MessageUsageHistory (remote mode),
	// matching the semantics used by the sidebar totals.
	for _, msg := range d.session.GetAllMessages() {
		if msg.Message.Role != chat.MessageRoleAssistant || msg.Message.Usage == nil {
			continue
		}
		hasPerMessageData = true
		totals.inputTokens += msg.Message.Usage.InputTokens + msg.Message.Usage.CachedInputTokens + msg.Message.Usage.CacheWriteTokens
		totals.outputTokens += msg.Message.Usage.OutputTokens
	}
	if !hasPerMessageData {
		for _, rec := range d.session.MessageUsageHistory {
			hasPerMessageData = true
			totals.inputTokens += rec.Usage.InputTokens + rec.Usage.CachedInputTokens + rec.Usage.CacheWriteTokens
			totals.outputTokens += rec.Usage.OutputTokens
		}
	}

	return totals, hasPerMessageData
}

func (d *usageDialog) renderContent(contentWidth int) string {
	sess := d.session

	// Context (latest call) comes from session-level fields populated from TokenUsageEvent.
	var latestIn, latestOut int64
	var ctxLen, ctxLimit int64
	if sess != nil {
		latestIn = sess.InputTokens
		latestOut = sess.OutputTokens
		ctxLen = sess.ContextLength
		ctxLimit = sess.ContextLimit
	}
	latestTotal := latestIn + latestOut

	// Total (session) comes from per-message usage history (same semantics as sidebar totals).
	totals, hasTotals := d.gatherSessionTotals()

	lines := []string{
		RenderTitle("Token Usage", contentWidth, styles.DialogTitleStyle),
		RenderSeparator(contentWidth),
		"",
		sectionStyle().Render("Context (latest call)"),
		"",
		fmt.Sprintf("%s %s", labelStyle().Render("input:"), valueStyle().Render(formatTokenCount(latestIn))),
		fmt.Sprintf("%s %s", labelStyle().Render("output:"), valueStyle().Render(formatTokenCount(latestOut))),
		fmt.Sprintf("%s %s", labelStyle().Render("total:"), valueStyle().Render(formatTokenCount(latestTotal))),
	}

	if ctxLimit > 0 {
		percent := (float64(ctxLen) / float64(ctxLimit)) * 100
		lines = append(lines, fmt.Sprintf("%s %s", labelStyle().Render("context:"), valueStyle().Render(fmt.Sprintf("%s / %s (%.0f%%)",
			formatTokenCount(ctxLen),
			formatTokenCount(ctxLimit),
			percent,
		))))
	}

	lines = append(lines, "", sectionStyle().Render("Total (session)"), "")

	if hasTotals {
		lines = append(lines,
			fmt.Sprintf("%s %s", labelStyle().Render("input:"), valueStyle().Render(formatTokenCount(totals.inputTokens))),
			fmt.Sprintf("%s %s", labelStyle().Render("output:"), valueStyle().Render(formatTokenCount(totals.outputTokens))),
			fmt.Sprintf("%s %s", labelStyle().Render("total:"), valueStyle().Render(formatTokenCount(totals.totalTokens()))),
		)
	} else {
		lines = append(lines, styles.MutedStyle.Render("No per-message usage data available for this session."))
	}

	lines = append(lines, "", RenderHelpKeys(contentWidth, "Esc", "close"))
	return lipgloss.JoinVertical(lipgloss.Left, lines...)
}

func (d *usageDialog) renderPlainText() string {
	// Not currently wired to a copy action; keep for future parity with /cost.
	content := d.renderContent(80)
	return strings.ReplaceAll(content, "\x1b", "")
}

