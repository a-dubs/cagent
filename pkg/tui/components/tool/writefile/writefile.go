package writefile

import (
	"encoding/json"
	"fmt"

	"github.com/docker/cagent/pkg/tools/builtin"
	"github.com/docker/cagent/pkg/tui/components/spinner"
	"github.com/docker/cagent/pkg/tui/components/tool/editfile"
	"github.com/docker/cagent/pkg/tui/components/toolcommon"
	"github.com/docker/cagent/pkg/tui/core/layout"
	"github.com/docker/cagent/pkg/tui/service"
	"github.com/docker/cagent/pkg/tui/styles"
	"github.com/docker/cagent/pkg/tui/types"
)

func New(msg *types.Message, sessionState service.SessionStateReader) layout.Model {
	return toolcommon.NewBase(msg, sessionState, render)
}

func render(msg *types.Message, s spinner.Spinner, sessionState service.SessionStateReader, width, _ int) string {
	// Parse tool arguments to extract the path for display.
	var args builtin.WriteFileArgs
	if msg.ToolCall.Function.Arguments != "" {
		if err := json.Unmarshal([]byte(msg.ToolCall.Function.Arguments), &args); err != nil {
			// Fail silently to avoid breaking the TUI.
			args.Path = ""
		}
	}

	// If meta is missing (older sessions), fall back to the simple view.
	meta, ok := extractWriteFileMeta(msg)
	if !ok {
		return toolcommon.RenderTool(
			msg,
			s,
			toolcommon.ShortenPath(args.Path),
			"",
			width,
			sessionState.HideToolResults(),
		)
	}

	// Header line (friendly header if available; otherwise standard tool header).
	header := ""
	if friendly, ok := toolcommon.RenderFriendlyHeader(msg, s, styles.ToolName); ok {
		header = friendly
	} else {
		header = fmt.Sprintf(
			"%s%s %s",
			toolcommon.Icon(msg, s),
			styles.ToolName.Render(msg.ToolDefinition.DisplayName()),
			styles.ToolMessageStyle.Render(toolcommon.ShortenPath(meta.Path)),
		)
	}

	// Tool results are hidden when the user collapses them.
	if sessionState.HideToolResults() {
		return header
	}

	// Calculate available width for diff/preview rendering, accounting for ToolCallResult padding.
	contentWidth := width - styles.ToolCallResult.GetHorizontalFrameSize()

	// New file: show a "new file" indicator + content preview (10-line expansion behavior).
	if meta.IsNew {
		preview, _ := toolcommon.FormatToolResultExpandable(meta.NewContent, width, msg.ToolResultExpanded)

		title := styles.DiffAddStyle.Render("new file")
		if meta.NewTruncated {
			title += " " + styles.MutedStyle.Render("(truncated)")
		}

		body := title
		if meta.NewContent != "" {
			body += "\n" + preview
		}
		return header + "\n" + styles.ToolCallResult.Render(body)
	}

	// Overwrite: if old content is present, render a diff between old/new.
	if meta.OldContent != "" || meta.OldSizeBytes > 0 {
		splitView := editfile.ChooseSplitDiffView(sessionState, contentWidth)
		diff := editfile.RenderTextDiff(meta.Path, meta.OldContent, meta.NewContent, contentWidth, splitView, msg.ToolStatus)

		if meta.OldTruncated || meta.NewTruncated {
			note := styles.MutedStyle.Render("(diff truncated: tool captured partial file content)")
			if diff == "" {
				diff = note
			} else {
				diff = note + "\n" + diff
			}
		}

		return header + "\n" + styles.ToolCallResult.Render(diff)
	}

	// If we have meta but it doesn't contain enough info, fall back to simple header.
	return header
}

func extractWriteFileMeta(msg *types.Message) (builtin.WriteFileMeta, bool) {
	if msg == nil || msg.ToolResult == nil || msg.ToolResult.Meta == nil {
		return builtin.WriteFileMeta{}, false
	}

	switch m := msg.ToolResult.Meta.(type) {
	case builtin.WriteFileMeta:
		return m, true
	case *builtin.WriteFileMeta:
		if m == nil {
			return builtin.WriteFileMeta{}, false
		}
		return *m, true
	case map[string]any:
		// Meta may arrive as a decoded map in some restore/serialization paths.
		var out builtin.WriteFileMeta
		if v, ok := m["path"].(string); ok {
			out.Path = v
		}
		if v, ok := m["isNew"].(bool); ok {
			out.IsNew = v
		}
		if v, ok := m["oldContent"].(string); ok {
			out.OldContent = v
		}
		if v, ok := m["newContent"].(string); ok {
			out.NewContent = v
		}
		if v, ok := m["oldTruncated"].(bool); ok {
			out.OldTruncated = v
		}
		if v, ok := m["newTruncated"].(bool); ok {
			out.NewTruncated = v
		}
		// Sizes might come back as float64 depending on JSON decoding.
		if v, ok := m["oldSizeBytes"]; ok {
			switch n := v.(type) {
			case int:
				out.OldSizeBytes = n
			case int64:
				out.OldSizeBytes = int(n)
			case float64:
				out.OldSizeBytes = int(n)
			}
		}
		if v, ok := m["newSizeBytes"]; ok {
			switch n := v.(type) {
			case int:
				out.NewSizeBytes = n
			case int64:
				out.NewSizeBytes = int(n)
			case float64:
				out.NewSizeBytes = int(n)
			}
		}

		// Require at least a path to consider this valid meta for rendering.
		if out.Path == "" {
			return builtin.WriteFileMeta{}, false
		}
		return out, true
	}

	return builtin.WriteFileMeta{}, false
}
