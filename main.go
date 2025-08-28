package main

import (
	"embed"

	"github.com/docker/cagent/cmd/root"
)

//go:embed web/dist
var webAssets embed.FS

func main() {
	root.SetWebAssets(webAssets)
	root.Execute()
}