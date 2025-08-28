#!/bin/sh

# This scripts configures claude code to use the Docker AI Gateway.
# If you have an existing configuration, it will be backed up to ~/.claude/settings.json.bak
# To undo these changes, run the script with "uninstall" or "rm" as an argument.
#
# How does it work?
# It sets the ANTHROPIC_BASE_URL to the Docker AI Gateway URL and uses a custom token helper script
# that retrieves the Docker AI Gateway token from the Docker Desktop backend socket.

set -euo pipefail

CLAUDE_DIR="$HOME/.claude"
CLAUDE_SETTINGS="$CLAUDE_DIR/settings.json"
TOKEN_HELPER="$CLAUDE_DIR/docker-token-helper.sh"

if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required but not installed. Please install jq." >&2
    exit 1
fi

install() {
    echo "Enabling Claude to use Docker AI Gateway..."
    if ! command -v curl >/dev/null 2>&1; then
        echo "curl is required but not installed. Please install curl." >&2
        exit 1
    fi
    mkdir -p "$CLAUDE_DIR"
    if test -f "$CLAUDE_SETTINGS"; then
        echo "Backing up existing Claude settings to $CLAUDE_SETTINGS.bak"
        cp "$CLAUDE_SETTINGS" "$CLAUDE_SETTINGS.bak"
    else
        echo "No existing Claude settings found, creating new configuration."
        echo '{}' > "$CLAUDE_SETTINGS"
    fi

    jq '.env.ANTHROPIC_BASE_URL = "https://gw.docker.com/models"' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv -f "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"
    jq '.env.CLAUDE_CODE_API_KEY_HELPER_TTL_MS = 60000' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv -f "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"
    jq '.apiKeyHelper = "'$TOKEN_HELPER'"' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv -f "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"


    cat <<EOF > "$TOKEN_HELPER"
    #!/bin/sh
    WSL_SOCK=/var/run/docker-cli.sock
    MACOS_SOCK=~/Library/Containers/com.docker.docker/Data/backend.sock
    LINUX_SOCK=~/.docker/desktop/backend.sock
    test -S \$WSL_SOCK && SOCK=\$WSL_SOCK
    test -S \$MACOS_SOCK && SOCK=\$MACOS_SOCK
    test -S \$LINUX_SOCK && SOCK=\$LINUX_SOCK
    if [ ! -S "\$SOCK" ]; then
        echo "Docker AI Gateway socket not found at \$SOCK. Please ensure Docker is running." >&2
        exit 1
    fi
    curl -sSL --unix-socket \$SOCK "http://_/registry/token" | tr -d \"
EOF
    chmod +x "$TOKEN_HELPER"
    echo "Claude configuration updated to use Docker AI Gateway."
    echo "Run 'claude' to start using it."
    echo "If you need to revert these changes, run $0 uninstall".
}

uninstall() {
    echo "Disabling Claude from using Docker AI Gateway..."
    jq 'del(.env.ANTHROPIC_BASE_URL)' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv -f "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"
    jq 'del(.env.CLAUDE_CODE_API_KEY_HELPER_TTL_MS)' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv -f "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"
    jq 'del(.apiKeyHelper)' "$CLAUDE_SETTINGS" > "$CLAUDE_SETTINGS.tmp" && mv -f "$CLAUDE_SETTINGS.tmp" "$CLAUDE_SETTINGS"
    rm -f "$TOKEN_HELPER"
    echo "Claude configuration reverted."
}

arg="${1:-}"
if [ "$arg" = "uninstall" ] || [ "$arg" = "rm" ]; then
    uninstall
else
    install
fi
