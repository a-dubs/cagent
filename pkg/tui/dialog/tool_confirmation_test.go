package dialog

import (
	"testing"

	tea "charm.land/bubbletea/v2"
	"github.com/stretchr/testify/require"

	"github.com/docker/cagent/pkg/runtime"
	"github.com/docker/cagent/pkg/session"
	"github.com/docker/cagent/pkg/tools"
	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/service"
)

func TestToolConfirmationDialog_ApproveAllRespectsYoloExceptWrites(t *testing.T) {
	t.Parallel()

	sess := session.New(session.WithYoloExceptWrites(true))
	sessionState := service.NewSessionState(sess)

	evt := &runtime.ToolCallConfirmationEvent{
		ToolCall: tools.ToolCall{
			ID:   "call-1",
			Type: "function",
			Function: tools.FunctionCall{
				Name:      builtin.ToolNameWriteFile,
				Arguments: `{"path":"x","content":"y"}`,
			},
		},
		ToolDefinition: tools.Tool{Name: builtin.ToolNameWriteFile},
		AgentContext:   runtime.AgentContext{AgentName: "root"},
	}

	d := NewToolConfirmationDialog(evt, sessionState)

	_, cmd := d.Update(tea.KeyPressMsg{Code: 'a'})
	msgs := collectMsgs(cmd)

	var foundResume bool
	for _, m := range msgs {
		if rm, ok := m.(RuntimeResumeMsg); ok {
			foundResume = true
			require.Equal(t, runtime.ResumeTypeApprove, rm.Request.Type, "approve all should not enable full yolo when --yolo-except-writes is active")
		}
	}
	require.True(t, foundResume, "expected a runtime resume message")
	require.False(t, sessionState.YoloMode(), "dialog should not flip full yolo mode when --yolo-except-writes is active")
}
