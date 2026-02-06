package autotail

import (
	"strings"

	"github.com/charmbracelet/x/ansi"
)

// DefaultWindowLines matches Cursor-style "tail" behavior.
const DefaultWindowLines = 10

// Model holds scroll + follow state for an auto-tail viewport.
//
// - When Follow is true, the viewport tracks the bottom as new content arrives.
// - When the user scrolls up, Follow becomes false (paused) and Offset becomes the top line index.
// - When the user scrolls back to bottom, Follow becomes true again.
type Model struct {
	WindowLines int

	// Offset is the top line index for the window when Follow=false.
	// When Follow=true, Offset is derived from content length and not authoritative.
	Offset int
	Follow bool

	lastContentLen int
}

func New() Model {
	return Model{
		WindowLines: DefaultWindowLines,
		Offset:      0,
		Follow:      true,
	}
}

func (m *Model) SetWindowLines(n int) {
	if n <= 0 {
		n = DefaultWindowLines
	}
	m.WindowLines = n
}

// Sync updates follow/offset behavior when the content changes.
// Call this whenever the backing content is updated.
func (m *Model) Sync(lines []string) {
	contentLen := len(lines)
	m.lastContentLen = contentLen
	if m.WindowLines <= 0 {
		m.WindowLines = DefaultWindowLines
	}

	if m.Follow {
		m.Offset = max(0, contentLen-m.WindowLines)
		return
	}

	// Clamp paused offset to new bounds.
	m.Offset = clamp(m.Offset, 0, max(0, contentLen-m.WindowLines))
}

// Scroll scrolls by delta lines (positive = down, negative = up).
// If scrolling moves away from bottom, Follow pauses.
// If scrolling reaches bottom, Follow resumes.
func (m *Model) Scroll(delta int, lines []string) {
	if delta == 0 {
		return
	}
	if m.WindowLines <= 0 {
		m.WindowLines = DefaultWindowLines
	}

	maxOffset := max(0, len(lines)-m.WindowLines)

	// If we were following and the user scrolls up, pause at current top.
	if m.Follow && delta < 0 {
		m.Follow = false
		m.Offset = maxOffset // start from bottom window
	}

	m.Offset = clamp(m.Offset+delta, 0, maxOffset)

	if m.Offset >= maxOffset {
		// At bottom: resume follow.
		m.Follow = true
		m.Offset = maxOffset
	} else {
		m.Follow = false
	}
}

// Window returns the visible window lines.
func (m *Model) Window(lines []string) []string {
	if m.WindowLines <= 0 {
		m.WindowLines = DefaultWindowLines
	}
	if len(lines) == 0 {
		return nil
	}

	maxOffset := max(0, len(lines)-m.WindowLines)
	offset := m.Offset
	if m.Follow {
		offset = maxOffset
	}
	offset = clamp(offset, 0, maxOffset)

	end := min(offset+m.WindowLines, len(lines))
	return lines[offset:end]
}

// Render joins window lines and ensures no ANSI bleed.
func (m *Model) Render(lines []string) string {
	win := m.Window(lines)
	if len(win) == 0 {
		return ""
	}
	// Defensive: callers often pass already-stripped content; keep this safe anyway.
	for i := range win {
		win[i] = ansi.Strip(win[i])
	}
	return strings.Join(win, "\n")
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

