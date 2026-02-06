package shell

import (
	"fmt"
	"strings"

	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/components/spinner"
	"github.com/docker/cagent/pkg/tui/components/toolcommon"
	"github.com/docker/cagent/pkg/tui/core/layout"
	"github.com/docker/cagent/pkg/tui/service"
	"github.com/docker/cagent/pkg/tui/styles"
	"github.com/docker/cagent/pkg/tui/types"
)

func formatShellCmdForDisplay(cmd string) string {
	trimmed := strings.TrimLeft(cmd, " \t")
	if trimmed == "" {
		return cmd
	}
	if strings.HasPrefix(trimmed, "$") {
		return cmd
	}
	return "$ " + cmd
}

func extractExitCode(msg *types.Message) (int, bool) {
	if msg == nil || msg.ToolResult == nil || msg.ToolResult.Meta == nil {
		return 0, false
	}

	switch meta := msg.ToolResult.Meta.(type) {
	case builtin.ShellResultMeta:
		return meta.ExitCode, true
	case *builtin.ShellResultMeta:
		if meta == nil {
			return 0, false
		}
		return meta.ExitCode, true
	case map[string]any:
		// Meta may arrive as a decoded map in some restore/serialization paths.
		if v, ok := meta["exit_code"]; ok {
			switch n := v.(type) {
			case int:
				return n, true
			case int32:
				return int(n), true
			case int64:
				return int(n), true
			case float64:
				return int(n), true
			}
		}
	}

	return 0, false
}

func formatShellArgsForDisplay(msg *types.Message, cmd string) string {
	display := formatShellCmdForDisplay(cmd)

	// Only show exit code once the tool has completed and metadata is present.
	if msg == nil || msg.ToolStatus != types.ToolStatusCompleted {
		return display
	}
	exitCode, ok := extractExitCode(msg)
	if !ok {
		return display
	}
	if exitCode == 0 {
		return display
	}

	// Make non-zero exit codes prominent.
	return display + " " + styles.ToolErrorMessageStyle.Render(fmt.Sprintf("(exit %d)", exitCode))
}

func New(msg *types.Message, sessionState service.SessionStateReader) layout.Model {
	return toolcommon.NewBase(msg, sessionState, func(msg *types.Message, s spinner.Spinner, sessionState service.SessionStateReader, width, height int) string {
		_ = height
		arg := ""
		if msg.ToolCall.Function.Arguments != "" {
			arg = toolcommon.ExtractField(func(a builtin.RunShellArgs) string {
				return formatShellArgsForDisplay(msg, a.Cmd)
			})(msg.ToolCall.Function.Arguments)
		}
		return toolcommon.RenderTool(msg, s, arg, "", width, sessionState.HideToolResults())
	})
}
