package editfile

const splitDiffAutoWidthThreshold = 120

type diffPreferenceReader interface {
	SplitDiffView() bool
	HasExplicitDiffPreference() bool
}

func chooseSplitDiffView(sessionState diffPreferenceReader, availableWidth int) bool {
	// Explicit preference always wins.
	if sessionState.HasExplicitDiffPreference() {
		return sessionState.SplitDiffView()
	}

	// Otherwise pick based on width.
	return availableWidth > splitDiffAutoWidthThreshold
}

