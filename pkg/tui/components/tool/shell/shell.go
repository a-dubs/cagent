package shell

import (
	"strings"

	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/components/toolcommon"
	"github.com/docker/cagent/pkg/tui/core/layout"
	"github.com/docker/cagent/pkg/tui/service"
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

func New(msg *types.Message, sessionState service.SessionStateReader) layout.Model {
	return toolcommon.NewBase(msg, sessionState, toolcommon.SimpleRenderer(
		toolcommon.ExtractField(func(a builtin.RunShellArgs) string {
			return formatShellCmdForDisplay(a.Cmd)
		}),
	))
}
