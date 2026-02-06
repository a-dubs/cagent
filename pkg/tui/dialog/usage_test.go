package dialog

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/docker/cagent/pkg/chat"
	"github.com/docker/cagent/pkg/session"
)

func TestNewUsageDialog(t *testing.T) {
	t.Parallel()

	sess := session.New()
	d := NewUsageDialog(sess)
	require.NotNil(t, d)
}

func TestUsageDialogView_WithContextAndTotals(t *testing.T) {
	t.Parallel()

	sess := session.New()
	sess.InputTokens = 120
	sess.OutputTokens = 45
	sess.ContextLength = 1000
	sess.ContextLimit = 2000

	// Add per-message usage so totals section can be computed.
	sess.AddMessage(&session.Message{
		AgentName: "root",
		Message: chat.Message{
			Role:  chat.MessageRoleAssistant,
			Model: "gpt-4o",
			Usage: &chat.Usage{
				InputTokens:       10,
				CachedInputTokens: 2,
				CacheWriteTokens:  3,
				OutputTokens:      4,
			},
		},
	})

	dialog := NewUsageDialog(sess)
	dialog.SetSize(100, 40)
	view := dialog.View()

	assert.Contains(t, view, "Token Usage")
	assert.Contains(t, view, "Context (latest call)")
	assert.Contains(t, view, "Total (session)")
	assert.Contains(t, view, "context:")
}

