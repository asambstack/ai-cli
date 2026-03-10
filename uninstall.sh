#!/usr/bin/env bash
set -euo pipefail

# ai-agents uninstaller
# Removes symlinks created by install.sh. Does not delete the repository.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

info()  { printf "\033[0;34m[info]\033[0m  %s\n" "$1"; }
ok()    { printf "${GREEN}[ok]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[warn]${NC}  %s\n" "$1"; }

# Remove a symlink only if it points into this repository.
safe_unlink() {
    local target="$1"

    if [ ! -L "$target" ]; then
        warn "Not a symlink, skipping: $target"
        return
    fi

    local dest
    dest="$(readlink "$target")"

    case "$dest" in
        "$REPO_DIR"*)
            rm "$target"
            ok "Removed: $target"
            ;;
        *)
            warn "Points elsewhere ($dest), skipping: $target"
            ;;
    esac
}

# Remove per-file symlinks that point into this repo.
unlink_files() {
    local dir="$1"
    local pattern="${2:-*}"

    for f in "$dir"/$pattern; do
        [ -L "$f" ] || continue
        safe_unlink "$f"
    done
}

echo ""
echo "  ai-agents uninstaller"
echo "  ====================="
echo "  repo: $REPO_DIR"
echo ""

info "Removing directory symlinks..."

safe_unlink "$HOME/.ai-agents/agents"
safe_unlink "$HOME/.ai-agents/skills"
safe_unlink "$HOME/.ai-agents/opencode"
safe_unlink "$HOME/.config/opencode/opencode.json"
safe_unlink "$HOME/.ai-manager/agents"
safe_unlink "$HOME/.ai-manager/skills"

info "Removing Claude command symlinks..."
unlink_files "$HOME/.claude/commands" "*.md"

info "Removing Claude rule symlinks..."
unlink_files "$HOME/.claude/rules/common" "*.md"

echo ""
printf "${GREEN}Uninstall complete.${NC}\n"
echo ""
echo "  The repository at $REPO_DIR was NOT deleted."
echo "  To fully remove: rm -rf $REPO_DIR"
echo ""
echo "  If backups were created during install, they remain at their .backup.* paths."
echo ""
