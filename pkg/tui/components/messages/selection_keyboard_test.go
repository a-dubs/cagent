package messages

import (
	"testing"

	tea "charm.land/bubbletea/v2"
	"github.com/stretchr/testify/require"

	"github.com/docker/cagent/pkg/tui/service"
	"github.com/docker/cagent/pkg/tui/types"
)

func TestShiftArrow_StartsAndExtendsSelectionByLine(t *testing.T) {
	t.Parallel()

	sessionState := &service.SessionState{}
	m := NewScrollableView(80, 10, sessionState).(*model)
	m.SetSize(80, 10)

	// Ensure we have multiple rendered lines to move across.
	msg := types.Agent(types.MessageTypeAssistant, "root", "line1\nline2\nline3")
	m.messages = append(m.messages, msg)
	m.views = append(m.views, m.createMessageView(msg))
	_ = m.View()

	require.False(t, m.selection.active)

	// Shift+Down should start selection at top visible line and extend one line down.
	m.Update(tea.KeyPressMsg{Code: tea.KeyDown, Mod: tea.ModShift})
	require.True(t, m.selection.active)
	require.Equal(t, 0, m.selection.startLine)
	require.Equal(t, 1, m.selection.endLine)
}

func TestShiftArrow_ExtendsSelectionByCharacter(t *testing.T) {
	t.Parallel()

	sessionState := &service.SessionState{}
	m := NewScrollableView(80, 10, sessionState).(*model)
	m.SetSize(80, 10)

	msg := types.Agent(types.MessageTypeAssistant, "root", "hello\nworld")
	m.messages = append(m.messages, msg)
	m.views = append(m.views, m.createMessageView(msg))
	_ = m.View()

	// Start selection at (0,0) by shift-right, then extend again.
	m.Update(tea.KeyPressMsg{Code: tea.KeyRight, Mod: tea.ModShift})
	require.True(t, m.selection.active)
	require.Equal(t, 0, m.selection.startLine)
	require.Equal(t, 0, m.selection.endLine)
	startCol := m.selection.startCol
	require.Equal(t, m.selection.startCol+1, m.selection.endCol)

	m.Update(tea.KeyPressMsg{Code: tea.KeyRight, Mod: tea.ModShift})
	require.Equal(t, startCol+2, m.selection.endCol)
}

func TestCopyShortcut_CopiesSelectionOnlyWhenActive(t *testing.T) {
	t.Parallel()

	sessionState := &service.SessionState{}
	m := NewScrollableView(80, 10, sessionState).(*model)
	m.SetSize(80, 10)

	msg := types.Agent(types.MessageTypeAssistant, "root", "hello")
	m.messages = append(m.messages, msg)
	m.views = append(m.views, m.createMessageView(msg))
	_ = m.View()

	// No selection: ctrl+c should not be consumed by messages component.
	_, cmd := m.Update(tea.KeyPressMsg{Code: 'c', Mod: tea.ModCtrl})
	require.Nil(t, cmd)

	// With selection: ctrl+c should copy selection.
	m.Update(tea.KeyPressMsg{Code: tea.KeyRight, Mod: tea.ModShift})
	require.True(t, m.selection.active)

	_, cmd = m.Update(tea.KeyPressMsg{Code: 'c', Mod: tea.ModCtrl})
	require.NotNil(t, cmd)
}

