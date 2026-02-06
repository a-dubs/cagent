package tools

import (
	"context"
)

// OutputStreamer is an optional, display-only callback that tools may use to stream
// incremental output while they execute.
//
// Tool implementations should treat this as best-effort: it may be absent, nil,
// or slow. It must never affect tool correctness.
type OutputStreamer func(delta string)

type outputStreamerKey struct{}

// WithOutputStreamer attaches an output streamer callback to a context.
func WithOutputStreamer(ctx context.Context, streamer OutputStreamer) context.Context {
	if streamer == nil {
		return ctx
	}
	return context.WithValue(ctx, outputStreamerKey{}, streamer)
}

// GetOutputStreamer returns the output streamer callback from context, if present.
func GetOutputStreamer(ctx context.Context) (OutputStreamer, bool) {
	v := ctx.Value(outputStreamerKey{})
	if v == nil {
		return nil, false
	}
	s, ok := v.(OutputStreamer)
	return s, ok && s != nil
}

// streamingWriter adapts an OutputStreamer to an io.Writer-like sink.
// It is defined here so tools don't need to reimplement the adapter.
type streamingWriter struct {
	stream OutputStreamer
}

func NewStreamingWriter(stream OutputStreamer) *streamingWriter {
	return &streamingWriter{stream: stream}
}

func (w *streamingWriter) Write(p []byte) (n int, err error) {
	if w == nil || w.stream == nil || len(p) == 0 {
		return len(p), nil
	}
	// Best-effort: treat bytes as UTF-8-ish and forward as-is.
	w.stream(string(p))
	return len(p), nil
}

