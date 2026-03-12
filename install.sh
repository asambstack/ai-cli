#!/usr/bin/env bash
set -euo pipefail

# ai-agents installer
# Creates symlinks from this repository to the locations expected by
# Claude Code, OpenCode, and ai-manager.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { printf "${BLUE}[info]${NC}  %s\n" "$1"; }
ok()    { printf "${GREEN}[ok]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}[warn]${NC}  %s\n" "$1"; }
error() { printf "${RED}[error]${NC} %s\n" "$1"; }

# Back up a file or directory before replacing it with a symlink.
# Skips if the target is already a symlink pointing to the correct source.
backup_and_link() {
    local source="$1"
    local target="$2"

    if [ -L "$target" ]; then
        local current
        current="$(readlink "$target")"
        if [ "$current" = "$source" ]; then
            ok "Already linked: $target"
            return
        fi
        rm "$target"
        warn "Replaced stale symlink: $target"
    elif [ -e "$target" ]; then
        local backup="${target}.backup.${TIMESTAMP}"
        mv "$target" "$backup"
        warn "Backed up existing: $target -> $backup"
    fi

    ln -s "$source" "$target"
    ok "Linked: $target -> $source"
}

# Link every file matching a glob from source_dir into target_dir.
link_files() {
    local source_dir="$1"
    local target_dir="$2"
    local pattern="${3:-*}"

    for src in "$source_dir"/$pattern; do
        [ -e "$src" ] || continue
        local name
        name="$(basename "$src")"
        backup_and_link "$src" "$target_dir/$name"
    done
}

echo ""
echo "  ai-agents installer"
echo "  ==================="
echo "  repo: $REPO_DIR"
echo ""

# Clean up broken symlinks in a directory that point into this repo.
cleanup_broken_links() {
    local target_dir="$1"
    [ -d "$target_dir" ] || return
    for link in "$target_dir"/*; do
        [ -L "$link" ] || continue
        if ! [ -e "$link" ]; then
            local dest
            dest="$(readlink "$link")"
            case "$dest" in
                "$REPO_DIR"*)
                    rm "$link"
                    warn "Removed broken symlink: $link -> $dest"
                    ;;
            esac
        fi
    done
}

# ── 1. Create target directories ──────────────────────────────────────

info "Creating directories..."

mkdir -p "$HOME/.ai-agents"
mkdir -p "$HOME/.claude/commands"
mkdir -p "$HOME/.claude/rules/common"
mkdir -p "$HOME/.config/opencode"
mkdir -p "$HOME/.ai-manager"

ok "Directories ready"

# ── 2. Agents and skills (directory symlinks) ─────────────────────────

info "Linking agents and skills..."

backup_and_link "$REPO_DIR/agents" "$HOME/.ai-agents/agents"
backup_and_link "$REPO_DIR/skills" "$HOME/.ai-agents/skills"

# ── 3. OpenCode integration (directory + file symlinks) ───────────────

info "Linking OpenCode integration..."

backup_and_link "$REPO_DIR/opencode" "$HOME/.ai-agents/opencode"
backup_and_link "$REPO_DIR/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"

# ── 4. Claude Code commands (per-file symlinks) ──────────────────────

info "Linking Claude commands..."

link_files "$REPO_DIR/claude/commands" "$HOME/.claude/commands" "*.md"

# ── 5. Claude Code rules (per-file symlinks) ─────────────────────────

info "Linking Claude rules..."

link_files "$REPO_DIR/claude/rules" "$HOME/.claude/rules/common" "*.md"

# ── 5b. Clean up broken symlinks ───────────────────────────────────────

info "Cleaning up broken symlinks..."

cleanup_broken_links "$HOME/.claude/commands"
cleanup_broken_links "$HOME/.claude/rules/common"

# ── 6. ai-manager integration (directory symlinks) ───────────────────

info "Linking ai-manager integration..."

backup_and_link "$REPO_DIR/agents" "$HOME/.ai-manager/agents"
backup_and_link "$REPO_DIR/skills" "$HOME/.ai-manager/skills"

# ── 7. CLI tool ──────────────────────────────────────────────────────

info "Installing ai CLI..."

if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    (cd "$REPO_DIR/cli" && npm install --silent 2>/dev/null && npm run build --silent 2>/dev/null && npm link --force 2>/dev/null)
    if command -v ai >/dev/null 2>&1; then
        ok "ai CLI installed globally"
    else
        warn "ai CLI build succeeded but 'ai' not found in PATH"
    fi
else
    warn "Node.js not found — skipping ai CLI install"
fi

# ── 8. Validation ────────────────────────────────────────────────────

echo ""
info "Validating symlinks..."

ERRORS=0

validate_link() {
    local target="$1"
    if [ -L "$target" ] && [ -e "$target" ]; then
        return 0
    else
        error "Broken or missing: $target"
        ERRORS=$((ERRORS + 1))
        return 1
    fi
}

validate_link "$HOME/.ai-agents/agents"
validate_link "$HOME/.ai-agents/skills"
validate_link "$HOME/.ai-agents/opencode"
validate_link "$HOME/.config/opencode/opencode.json"
validate_link "$HOME/.ai-manager/agents"
validate_link "$HOME/.ai-manager/skills"

for f in "$HOME/.claude/commands"/*.md; do
    [ -L "$f" ] && validate_link "$f"
done

for f in "$HOME/.claude/rules/common"/*.md; do
    [ -L "$f" ] && validate_link "$f"
done

# ── 8. Summary ───────────────────────────────────────────────────────

echo ""
if [ "$ERRORS" -eq 0 ]; then
    printf "${GREEN}Installation complete.${NC}\n"
else
    printf "${RED}Installation finished with %d error(s).${NC}\n" "$ERRORS"
fi

echo ""
echo "  Symlink summary:"
echo "  ───────────────────────────────────────────────────"
echo "  ~/.ai-agents/agents      -> repo/agents"
echo "  ~/.ai-agents/skills      -> repo/skills"
echo "  ~/.ai-agents/opencode    -> repo/opencode"
echo "  ~/.ai-manager/agents     -> repo/agents"
echo "  ~/.ai-manager/skills     -> repo/skills"
echo "  ~/.claude/commands/*.md   -> repo/claude/commands/*"
echo "  ~/.claude/rules/common/*  -> repo/claude/rules/*"
echo "  ~/.config/opencode/opencode.json -> repo/opencode/opencode.json"
echo ""
echo "  Usage:"
echo "    ai init          Set up repo context for AI editors"
echo "    ai learn          Add project knowledge"
echo "    ai refresh        Re-scan and update context"
echo "    ai status         Show current setup"
echo ""
echo "  Claude Code:  /review, /debug, /refactor, /feature, /write-tests, /manage"
echo "  OpenCode:     /review, /debug, /refactor, /feature, /write-tests, /manage"
echo ""
echo "  To update: cd $REPO_DIR && git pull"
echo ""
