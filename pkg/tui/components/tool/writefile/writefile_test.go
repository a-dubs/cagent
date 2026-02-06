package writefile

import (
	"strings"
	"testing"

	"github.com/docker/cagent/pkg/runtime"
	"github.com/docker/cagent/pkg/tools"
	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/types"
)

type testSessionState struct{}

func (testSessionState) SplitDiffView() bool                     { return false }
func (testSessionState) HasExplicitDiffPreference() bool         { return false }
func (testSessionState) YoloMode() bool                          { return false }
func (testSessionState) YoloExceptWrites() bool                  { return false }
func (testSessionState) Thinking() bool                          { return false }
func (testSessionState) HideToolResults() bool                   { return false }
func (testSessionState) CurrentAgentName() string                { return "" }
func (testSessionState) PreviousMessage() *types.Message         { return nil }
func (testSessionState) SessionTitle() string                    { return "" }
func (testSessionState) AvailableAgents() []runtime.AgentDetails { return nil }
func (testSessionState) GetCurrentAgent() runtime.AgentDetails   { return runtime.AgentDetails{} }

func TestWriteFileRenderer_ShowsDiffOnOverwrite(t *testing.T) {
	t.Parallel()

	msg := &types.Message{
		Type: types.MessageTypeToolCall,
		ToolCall: tools.ToolCall{
			ID: "toolcall-1",
			Function: tools.FunctionCall{
				Name:      builtin.ToolNameWriteFile,
				Arguments: `{"path":"test.txt","content":"after\n"}`,
			},
		},
		ToolDefinition: tools.Tool{
			Name: builtin.ToolNameWriteFile,
		},
		ToolStatus: types.ToolStatusCompleted,
		ToolResult: &tools.ToolCallResult{
			Meta: builtin.WriteFileMeta{
				Path:       "test.txt",
				IsNew:      false,
				OldContent: "before\n",
				NewContent: "after\n",
			},
		},
	}

	view := New(msg, testSessionState{}).View()

	// Diff rendering includes both old and new content.
	if !strings.Contains(view, "before") {
		t.Fatalf("expected view to include old content %q, got:\n%s", "before", view)
	}
	if !strings.Contains(view, "after") {
		t.Fatalf("expected view to include new content %q, got:\n%s", "after", view)
	}
}
