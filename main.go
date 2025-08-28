package main

import (
	"embed"
	"log"

	"github.com/docker/cagent/cmd/root"
	"github.com/joho/godotenv"
)

//go:embed web/dist
var webAssets embed.FS

func main() {
	// Load environment variables from a local .env file if present
	if err := godotenv.Load(); err != nil {
		// Not fatal if no .env is present
		if err.Error() != "open .env: no such file or directory" {
			log.Printf("warning: failed to load .env: %v", err)
		}
	}
	root.SetWebAssets(webAssets)
	root.Execute()
}
