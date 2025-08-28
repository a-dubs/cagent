package root

import (
	"embed"
	"fmt"
	"io/fs"
	"net"
	"os"

	"github.com/spf13/cobra"

	"github.com/docker/cagent/pkg/server"
	"github.com/docker/cagent/pkg/session"
	"github.com/docker/cagent/pkg/team"
)

var WebAssets embed.FS

var (
	webListenAddr string
	webSessionDb  string
)

func SetWebAssets(assets embed.FS) {
	WebAssets = assets
}

// NewWebCmd creates a new web command
func NewWebCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "web <agent-file>|<agents-dir>",
		Short: "Start the web interface server",
		Long:  `Start the web interface server with a nice frontend for interacting with agents`,
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			return runWeb(cmd, args)
		},
	}

	cmd.PersistentFlags().StringVarP(&webListenAddr, "listen", "l", ":8080", "Address to listen on")
	cmd.PersistentFlags().StringVarP(&webSessionDb, "session-db", "s", "session.db", "Path to the session database")
	cmd.PersistentFlags().StringSliceVar(&runConfig.EnvFiles, "env-from-file", nil, "Set environment variables from file")
	addGatewayFlags(cmd)

	return cmd
}

func runWeb(cmd *cobra.Command, args []string) error {
	ctx := cmd.Context()
	agentsPath := args[0]

	logger := newLogger()

	ln, err := server.Listen(ctx, webListenAddr)
	if err != nil {
		return fmt.Errorf("failed to listen on %s: %w", webListenAddr, err)
	}
	go func() {
		<-ctx.Done()
		_ = ln.Close()
	}()

	if _, ok := ln.(*net.TCPListener); ok {
		logger.Info("Web interface available at http://localhost" + webListenAddr)
	} else {
		logger.Info("Web interface available at " + webListenAddr)
	}

	logger.Debug("Starting web server", "agents", agentsPath, "debug_mode", debugMode)

	sessionStore, err := session.NewSQLiteSessionStore(webSessionDb)
	if err != nil {
		return fmt.Errorf("failed to create session store: %w", err)
	}

	var opts []server.Opt
	stat, err := os.Stat(agentsPath)
	if err != nil {
		return fmt.Errorf("failed to stat agents path: %w", err)
	}
	if stat.IsDir() {
		opts = append(opts, server.WithAgentsDir(agentsPath))
	}

	// Add web frontend
	webFS, err := fs.Sub(WebAssets, "web/dist")
	if err != nil {
		return fmt.Errorf("failed to create web filesystem: %w", err)
	}
	opts = append(opts, server.WithFrontend(webFS))

	opts = append(opts, server.WithAutoRunTools(true))

	// Lazy-load teams on demand in the server; start with an empty map.
	s := server.New(logger, sessionStore, runConfig, make(map[string]*team.Team), opts...)
	return s.Serve(ctx, ln)
}
