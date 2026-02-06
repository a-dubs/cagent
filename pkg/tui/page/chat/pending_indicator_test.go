package chat

import (
	"testing"

	"github.com/docker/cagent/pkg/session"
	"github.com/docker/cagent/pkg/tui/components/messages"
	"github.com/docker/cagent/pkg/tui/components/sidebar"
	"github.com/docker/cagent/pkg/tui/components/spinner"
	"github.com/docker/cagent/pkg/tui/service"
	"github.com/docker/cagent/pkg/tui/styles"
)

func TestPendingIndicatorDebounceAndHide(t *testing.T) {
	t.Parallel()

	sess := &session.Session{}
	state := service.NewSessionState(sess)

	p := &chatPage{
		width:         160,
		height:        40,
		inputHeight:   6,
		working:       true, // mimic active stream; avoids needing a real editor
		sessionState:  state,
		sidebar:       sidebar.New(state),
		messages:      messages.New(state),
		pendingSpinner: spinner.New(spinner.ModeSpinnerOnly, styles.SpinnerDotsAccentStyle),
	}

	// Ensure messages has a size so pending indicator resize is meaningful.
	_ = p.messages.SetSize(120, 20)

	// Simulate stream start: awaiting-first-output is true, but indicator should be hidden until debounce fires.
	p.awaitingFirstOutput = true
	p.pendingResponseSeq++
	if !p.awaitingFirstOutput {
		t.Fatalf("expected awaitingFirstOutput=true after stream start")
	}
	if p.pendingResponse {
		t.Fatalf("expected pendingResponse=false immediately (debounced)")
	}

	// Debounce tick fires for current seq -> should show indicator.
	_, _ = p.Update(pendingResponseDebounceMsg{seq: p.pendingResponseSeq})
	if !p.pendingResponse {
		t.Fatalf("expected pendingResponse=true after debounce tick")
	}

	// First assistant chunk arrives -> should hide indicator and end awaiting-first-output phase.
	_ = p.markFirstOutputArrived()
	if p.awaitingFirstOutput {
		t.Fatalf("expected awaitingFirstOutput=false after first output")
	}
	if p.pendingResponse {
		t.Fatalf("expected pendingResponse=false after first output")
	}

	// A stale debounce tick from before first output should be ignored (no re-show).
	oldSeq := p.pendingResponseSeq - 1
	_, _ = p.Update(pendingResponseDebounceMsg{seq: oldSeq})
	if p.pendingResponse {
		t.Fatalf("expected pendingResponse to remain false for stale debounce tick")
	}
}

