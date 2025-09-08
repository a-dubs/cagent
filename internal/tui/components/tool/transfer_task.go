package tool

import (
	"encoding/json"

	tea "github.com/charmbracelet/bubbletea/v2"
	"github.com/docker/cagent/internal/tui/styles"
	"github.com/docker/cagent/internal/tui/types"
)

type transferTaskModel struct {
	msg     *types.Message
	focused bool
}

func (m *transferTaskModel) Init() tea.Cmd {
	return nil
}

func (m *transferTaskModel) SetSize(width, height int) tea.Cmd {
	return nil
}

func (m *transferTaskModel) Update(tea.Msg) (tea.Model, tea.Cmd) {
	return m, nil
}

func (m *transferTaskModel) View() string {
	var params struct {
		Agent          string `json:"agent"`
		Task           string `json:"task"`
		ExpectedOutput string `json:"expected_output"`
	}
	if err := json.Unmarshal([]byte(m.msg.ToolCall.Function.Arguments), &params); err != nil {
		return "" // TODO: Partial tool call
	}

	// Add focus indicator
	var focusIndicator string
	if m.focused {
		focusIndicator = styles.HighlightStyle.Render("► ")
	} else {
		focusIndicator = "  "
	}

	return focusIndicator + m.msg.Sender + " -> " + params.Agent + " task : " + styles.MutedStyle.Render(params.Task)
}

// SetFocused sets the focus state
func (m *transferTaskModel) SetFocused(focused bool) {
	m.focused = focused
}

// IsFocused returns whether the model is focused
func (m *transferTaskModel) IsFocused() bool {
	return m.focused
}
