package editfile

import "testing"

type stubDiffPref struct {
	split    bool
	explicit bool
}

func (s stubDiffPref) SplitDiffView() bool              { return s.split }
func (s stubDiffPref) HasExplicitDiffPreference() bool  { return s.explicit }

func TestChooseSplitDiffView_ExplicitPreferenceWins(t *testing.T) {
	t.Parallel()

	// Explicit unified preference should stay unified even when wide.
	if got := ChooseSplitDiffView(stubDiffPref{split: false, explicit: true}, 999); got != false {
		t.Fatalf("expected explicit unified preference to win; got split=%v", got)
	}

	// Explicit split preference should stay split even when narrow.
	if got := ChooseSplitDiffView(stubDiffPref{split: true, explicit: true}, 40); got != true {
		t.Fatalf("expected explicit split preference to win; got split=%v", got)
	}
}

func TestChooseSplitDiffView_AutoByWidth(t *testing.T) {
	t.Parallel()

	state := stubDiffPref{split: true, explicit: false} // split value irrelevant when not explicit

	if got := ChooseSplitDiffView(state, 120); got != false {
		t.Fatalf("expected unified when width == 120; got split=%v", got)
	}
	if got := ChooseSplitDiffView(state, 121); got != true {
		t.Fatalf("expected split when width == 121; got split=%v", got)
	}
}

