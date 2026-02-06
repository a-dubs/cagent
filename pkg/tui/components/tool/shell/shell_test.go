package shell

import (
	"strings"
	"testing"

	"github.com/docker/cagent/pkg/tools"
	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/types"
)

func TestFormatShellCmdForDisplay(t *testing.T) {
	t.Parallel()

	tests := []struct {
		name string
		in   string
		want string
	}{
		{name: "empty", in: "", want: ""},
		{name: "spaces only", in: "   \t", want: "   \t"},
		{name: "basic command", in: "ls -la", want: "$ ls -la"},
		{name: "preserve leading whitespace", in: "  ls -la", want: "$   ls -la"},
		{name: "already prefixed", in: "$ ls -la", want: "$ ls -la"},
		{name: "already prefixed with leading whitespace", in: "  $ ls -la", want: "  $ ls -la"},
		{name: "no space after dollar is still considered prefixed", in: "$ls", want: "$ls"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := formatShellCmdForDisplay(tt.in); got != tt.want {
				t.Fatalf("formatShellCmdForDisplay(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestFormatShellArgsForDisplay_IncludesNonZeroExitCode(t *testing.T) {
	t.Parallel()

	msg := &types.Message{
		ToolStatus: types.ToolStatusCompleted,
		ToolResult: &tools.ToolCallResult{
			Meta: builtin.ShellResultMeta{ExitCode: 1},
		},
	}

	got := formatShellArgsForDisplay(msg, "false")
	if !strings.Contains(got, "(exit 1)") {
		t.Fatalf("expected formatted args to contain %q, got %q", "(exit 1)", got)
	}
	// Ensure we still include the $ prefix behavior.
	if !strings.Contains(got, "$ false") {
		t.Fatalf("expected formatted args to contain %q, got %q", "$ false", got)
	}
}

func TestFormatShellArgsForDisplay_OmitsZeroExitCode(t *testing.T) {
	t.Parallel()

	msg := &types.Message{
		ToolStatus: types.ToolStatusCompleted,
		ToolResult: &tools.ToolCallResult{
			Meta: builtin.ShellResultMeta{ExitCode: 0},
		},
	}

	got := formatShellArgsForDisplay(msg, "echo ok")
	if strings.Contains(got, "(exit 0)") {
		t.Fatalf("did not expect formatted args to contain %q, got %q", "(exit 0)", got)
	}
}

