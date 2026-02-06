package autotail

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAutoTail_FollowTracksBottomOnSync(t *testing.T) {
	t.Parallel()

	m := New()
	m.SetWindowLines(3)

	lines := []string{"a", "b", "c", "d", "e"}
	m.Sync(lines)

	assert.True(t, m.Follow)
	assert.Equal(t, 2, m.Offset) // 5-3
	assert.Equal(t, []string{"c", "d", "e"}, m.Window(lines))
}

func TestAutoTail_ScrollUpPausesFollowAndKeepsPosition(t *testing.T) {
	t.Parallel()

	m := New()
	m.SetWindowLines(3)

	lines := []string{"a", "b", "c", "d", "e"}
	m.Sync(lines)

	m.Scroll(-1, lines) // up one
	assert.False(t, m.Follow)
	assert.Equal(t, 1, m.Offset)
	assert.Equal(t, []string{"b", "c", "d"}, m.Window(lines))
}

func TestAutoTail_ScrollBackToBottomResumesFollow(t *testing.T) {
	t.Parallel()

	m := New()
	m.SetWindowLines(3)

	lines := []string{"a", "b", "c", "d", "e"}
	m.Sync(lines)
	m.Scroll(-10, lines) // go to top and pause
	assert.False(t, m.Follow)
	assert.Equal(t, 0, m.Offset)

	m.Scroll(10, lines) // back to bottom
	assert.True(t, m.Follow)
	assert.Equal(t, 2, m.Offset)
	assert.Equal(t, []string{"c", "d", "e"}, m.Window(lines))
}

func TestAutoTail_NewContentDoesNotJumpWhenPaused(t *testing.T) {
	t.Parallel()

	m := New()
	m.SetWindowLines(3)

	lines := []string{"a", "b", "c", "d", "e"}
	m.Sync(lines)
	m.Scroll(-1, lines) // pause at offset 1
	assert.False(t, m.Follow)

	lines = append(lines, "f", "g")
	m.Sync(lines)

	assert.False(t, m.Follow)
	assert.Equal(t, 1, m.Offset)
	assert.Equal(t, []string{"b", "c", "d"}, m.Window(lines))
}

func TestAutoTail_RenderStripsANSI(t *testing.T) {
	t.Parallel()

	m := New()
	m.SetWindowLines(2)

	lines := []string{
		"\x1b[31mred\x1b[0m",
		"plain",
		"\x1b[32mgreen\x1b[0m",
	}
	m.Sync(lines)

	out := m.Render(lines)
	assert.NotContains(t, out, "\x1b[")
	assert.Equal(t, strings.Join([]string{"plain", "green"}, "\n"), strings.TrimSpace(out))
}

