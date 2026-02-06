package shell

import "testing"

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

