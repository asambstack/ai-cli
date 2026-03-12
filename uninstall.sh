#!/usr/bin/env bash
set -euo pipefail

# ai-agents uninstaller
#
# Usage:
#   ./uninstall.sh              Remove symlinks, CLI, dashboard, and repository
#   ./uninstall.sh --purge      Also remove all .ai/ folders from repos

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
PURGE=false

for arg in "$@"; do
    case "$arg" in
        --purge) PURGE=true ;;
        --help|-h)
            echo "Usage: ./uninstall.sh [--purge]"
            echo "  --purge  Also remove .ai/ folders from all repos"
            exit 0
            ;;
    esac
done

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

info()  { printf "${BLUE}  [info]${NC}  %s\n" "$1"; }
ok()    { printf "${GREEN}  [ok]${NC}    %s\n" "$1"; }
warn()  { printf "${YELLOW}  [warn]${NC}  %s\n" "$1"; }

# Remove a symlink only if it points into this repository.
safe_unlink() {
    local target="$1"

    if [ ! -L "$target" ]; then
        return
    fi

    local dest
    dest="$(readlink "$target")"

    case "$dest" in
        "$REPO_DIR"*)
            rm "$target"
            ok "Removed: $target"
            ;;
    esac
}

# Remove per-file symlinks that point into this repo.
unlink_files() {
    local dir="$1"
    local pattern="${2:-*}"

    [ -d "$dir" ] || return
    for f in "$dir"/$pattern; do
        [ -L "$f" ] || continue
        safe_unlink "$f"
    done
}

echo ""
printf "${BOLD}  ai-agents uninstaller${NC}\n"
echo "  ====================="
echo ""

# ── 1. Confirm ────────────────────────────────────────────────────────

if [ "$PURGE" = true ]; then
    printf "${YELLOW}  This will remove ai-agents AND all .ai/ folders from your repos.${NC}\n"
else
    printf "  This will remove ai-agents from your system.\n"
fi
echo ""
printf "  Continue? [y/N] "
read -r CONFIRM
case "$CONFIRM" in
    [yY]|[yY][eE][sS]) ;;
    *)
        echo "  Cancelled."
        exit 0
        ;;
esac
echo ""

# ── 2. Remove symlinks ───────────────────────────────────────────────

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

# ── 3. Unlink CLI from PATH ──────────────────────────────────────────

info "Removing ai CLI from PATH..."

if command -v ai >/dev/null 2>&1; then
    AI_PATH="$(which ai)"
    # Only remove if it points into our repo
    if [ -L "$AI_PATH" ]; then
        REAL="$(readlink "$AI_PATH")"
        case "$REAL" in
            "$REPO_DIR"*)
                rm "$AI_PATH"
                ok "Removed: $AI_PATH"
                ;;
            *)
                # npm link creates symlinks in the npm prefix
                (cd "$REPO_DIR/cli" && npm unlink --global 2>/dev/null) && ok "npm unlinked ai CLI" || true
                ;;
        esac
    else
        (cd "$REPO_DIR/cli" && npm unlink --global 2>/dev/null) && ok "npm unlinked ai CLI" || true
    fi
else
    ok "ai CLI not found in PATH (already removed)"
fi

# ── 4. Clean up empty directories ────────────────────────────────────

info "Cleaning up empty directories..."

rmdir "$HOME/.ai-agents" 2>/dev/null && ok "Removed empty ~/.ai-agents" || true
rmdir "$HOME/.ai-manager" 2>/dev/null && ok "Removed empty ~/.ai-manager" || true
rmdir "$HOME/.claude/rules/common" 2>/dev/null || true
rmdir "$HOME/.claude/rules" 2>/dev/null || true
rmdir "$HOME/.claude/commands" 2>/dev/null || true

# ── 5. Purge .ai/ folders from repos ─────────────────────────────────

if [ "$PURGE" = true ]; then
    echo ""
    info "Scanning for .ai/ folders..."

    # Collect candidates first, show them, then confirm
    CANDIDATES=()

    while IFS= read -r ai_dir; do
        [ -d "$ai_dir" ] || continue

        # Fingerprint: a directory is ours if it contains ANY of these markers
        #   - config.json    (created by ai init)
        #   - context.md     (created by ai init / ai refresh)
        #   - learnings.md   (created by ai init / ai learn)
        #   - workspace.md   (symlink created by ai init --workspace)
        IS_OURS=false
        if [ -f "$ai_dir/config.json" ] ||
           [ -f "$ai_dir/context.md" ] ||
           [ -f "$ai_dir/learnings.md" ] ||
           [ -L "$ai_dir/workspace.md" ]; then
            IS_OURS=true
        fi

        if [ "$IS_OURS" = true ]; then
            CANDIDATES+=("$ai_dir")
        fi
    done < <(find "$HOME" -maxdepth 4 -type d -name ".ai" 2>/dev/null)

    if [ ${#CANDIDATES[@]} -eq 0 ]; then
        ok "No .ai/ folders found"
    else
        echo ""
        echo "  Found ${#CANDIDATES[@]} .ai/ folder(s) to remove:"
        echo ""
        for c in "${CANDIDATES[@]}"; do
            # Show what's inside so user can verify
            CONTENTS="$(ls -1 "$c" 2>/dev/null | tr '\n' ' ')"
            echo "    $c"
            echo "      contains: $CONTENTS"
        done
        echo ""
        printf "${YELLOW}  Delete all ${#CANDIDATES[@]} folders above? [y/N] ${NC}"
        read -r PURGE_CONFIRM
        case "$PURGE_CONFIRM" in
            [yY]|[yY][eE][sS])
                echo ""
                info "Purging..."

                PURGE_COUNT=0
                for ai_dir in "${CANDIDATES[@]}"; do
                    REPO_ROOT="$(dirname "$ai_dir")"

                    # Remove editor symlinks that point into .ai/
                    for link in \
                        "$REPO_ROOT/CLAUDE.md" \
                        "$REPO_ROOT/.cursorrules" \
                        "$REPO_ROOT/.windsurfrules" \
                        "$REPO_ROOT/.clinerules" \
                        "$REPO_ROOT/CONVENTIONS.md" \
                        "$REPO_ROOT/.github/copilot-instructions.md" \
                        "$REPO_ROOT/.opencode/instructions.md"; do
                        if [ -L "$link" ]; then
                            LINK_TARGET="$(readlink "$link")"
                            case "$LINK_TARGET" in
                                */.ai/*) rm "$link" ;;
                            esac
                        fi
                    done

                    # Only rmdir — won't delete if dir has other files
                    rmdir "$REPO_ROOT/.github" 2>/dev/null || true
                    rmdir "$REPO_ROOT/.opencode" 2>/dev/null || true

                    rm -rf "$ai_dir"
                    ok "Removed: $ai_dir"
                    PURGE_COUNT=$((PURGE_COUNT + 1))
                done

                ok "Purged $PURGE_COUNT .ai/ folder(s)"
                ;;
            *)
                echo "  Skipped purge."
                ;;
        esac
    fi
fi

# ── 6. Remove repository ─────────────────────────────────────────────

echo ""
info "Removing repository..."

rm -rf "$REPO_DIR"
ok "Removed: $REPO_DIR"

# ── 7. Done ──────────────────────────────────────────────────────────

echo ""
printf "${GREEN}${BOLD}  Uninstall complete.${NC}\n"
echo ""
if [ "$PURGE" = false ]; then
    echo "  Note: .ai/ folders in your repos were kept."
    echo "  To also remove those, reinstall and run: ./uninstall.sh --purge"
fi
echo ""
