package editfile

const splitDiffAutoWidthThreshold = 120

type diffPreferenceReader interface {
	SplitDiffView() bool
	HasExplicitDiffPreference() bool
}

// ChooseSplitDiffView decides whether to render a split diff view.
//
// Explicit user preference always wins; otherwise the decision is based on the
// available width.
func ChooseSplitDiffView(sessionState diffPreferenceReader, availableWidth int) bool {
	// Explicit preference always wins.
	if sessionState.HasExplicitDiffPreference() {
		return sessionState.SplitDiffView()
	}

	// Otherwise pick based on width.
	return availableWidth > splitDiffAutoWidthThreshold
}

