package messages

import (
	"testing"
	"time"

	"github.com/docker/cagent/pkg/tui/components/notification"
	"github.com/stretchr/testify/require"
)

func TestClipboardWriteResultMsg_SelectionAuto_ShowsToast(t *testing.T) {
	m := newModel(120, 24, nil)

	_, cmd := m.Update(clipboardWriteResultMsg{Source: clipboardCopySourceSelectionAuto, Err: nil})
	require.NotNil(t, cmd)

	got := cmd()
	show, ok := got.(notification.ShowMsg)
	require.True(t, ok)
	require.Equal(t, "Copied selection.", show.Text)
}

func TestClipboardWriteResultMsg_SelectionAuto_Throttled(t *testing.T) {
	m := newModel(120, 24, nil)
	m.selection.lastCopyToast = time.Now()

	_, cmd := m.Update(clipboardWriteResultMsg{Source: clipboardCopySourceSelectionAuto, Err: nil})
	require.Nil(t, cmd)
}

