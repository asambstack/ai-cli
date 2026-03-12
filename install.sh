#!/usr/bin/env bash
set -euo pipefail

# ai-agents installer
#
# Fresh install:
#   curl -fsSL https://raw.githubusercontent.com/asambstack/ai-cli/main/install.sh | bash
#
# Update (same command — detects existing install):
#   curl -fsSL https://raw.githubusercontent.com/asambstack/ai-cli/main/install.sh | bash
#
# Custom install dir or repo:
#   AI_AGENTS_DIR=~/my-path AI_AGENTS_REPO=git@github.com:myorg/ai-cli.git bash install.sh

INSTALL_DIR="${AI_AGENTS_DIR:-$HOME/.ai-agents-repo}"
REPO_URL="${AI_AGENTS_REPO:-https://github.com/asambstack/ai-cli.git}"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"

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
fail()  { printf "${RED}  [error]${NC} %s\n" "$1"; exit 1; }

echo ""
printf "${BOLD}  ai-agents installer${NC}\n"
echo "  ==================="
echo ""

# ── 0. Prerequisites ─────────────────────────────────────────────────

info "Checking prerequisites..."

command -v git  >/dev/null 2>&1 || fail "git is required but not found. Install git first."
command -v node >/dev/null 2>&1 || fail "Node.js is required but not found. Install Node.js 18+ first."
command -v npm  >/dev/null 2>&1 || fail "npm is required but not found. Install Node.js 18+ first."

NODE_MAJOR="$(node -e 'console.log(process.versions.node.split(".")[0])')"
if [ "$NODE_MAJOR" -lt 18 ] 2>/dev/null; then
    fail "Node.js 18+ required (found v$(node -v)). Please upgrade."
fi

ok "git, node v$(node -v | tr -d v), npm v$(npm -v)"

# ── 1. Clone or update repository ────────────────────────────────────

echo ""
if [ -d "$INSTALL_DIR/.git" ]; then
    info "Existing install found at $INSTALL_DIR"
    info "Pulling latest changes..."
    if (cd "$INSTALL_DIR" && git pull --ff-only 2>&1); then
        ok "Updated to latest"
    else
        warn "git pull failed — continuing with existing files"
    fi
else
    if [ -d "$INSTALL_DIR" ] && [ "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
        warn "$INSTALL_DIR exists but is not a git repo — backing up"
        mv "$INSTALL_DIR" "${INSTALL_DIR}.backup.${TIMESTAMP}"
    fi
    info "Cloning repository..."

    # Try HTTPS first (works without SSH keys), fall back to SSH
    if git clone --depth 1 "$REPO_URL" "$INSTALL_DIR" 2>/dev/null; then
        ok "Cloned to $INSTALL_DIR"
    elif git clone --depth 1 "git@github.com:asambstack/ai-cli.git" "$INSTALL_DIR" 2>/dev/null; then
        ok "Cloned to $INSTALL_DIR (via SSH)"
    else
        fail "Could not clone repository. Check your network and GitHub access."
    fi
fi

REPO_DIR="$INSTALL_DIR"

# ── 2. Build CLI ─────────────────────────────────────────────────────

echo ""
info "Installing ai CLI..."

(cd "$REPO_DIR/cli" && npm install --silent && npm run build --silent) || fail "CLI build failed"

# npm link to put 'ai' on PATH
(cd "$REPO_DIR/cli" && npm link --force 2>/dev/null) || true

if command -v ai >/dev/null 2>&1; then
    ok "ai CLI installed ($(which ai))"
else
    # Fallback: add a shell alias suggestion
    warn "npm link didn't add 'ai' to PATH"
    warn "Add this to your shell profile:"
    warn "  export PATH=\"$REPO_DIR/cli/node_modules/.bin:\$PATH\""
fi

# ── 3. Build dashboard ──────────────────────────────────────────────

echo ""
info "Installing dashboard..."

(cd "$REPO_DIR/dashboard" && npm install --silent && npm run build --silent) || fail "Dashboard build failed"

ok "Dashboard ready (run 'ai dashboard' to open)"

# ── 4. Create symlink directories ────────────────────────────────────

echo ""
info "Setting up symlinks..."

mkdir -p "$HOME/.ai-agents"
mkdir -p "$HOME/.claude/commands"
mkdir -p "$HOME/.claude/rules/common"
mkdir -p "$HOME/.config/opencode"
mkdir -p "$HOME/.ai-manager"

# ── Helper functions ──────────────────────────────────────────────────

backup_and_link() {
    local source="$1"
    local target="$2"

    if [ -L "$target" ]; then
        local current
        current="$(readlink "$target")"
        if [ "$current" = "$source" ]; then
            return 0  # already correct, skip silently
        fi
        rm "$target"
    elif [ -e "$target" ]; then
        mv "$target" "${target}.backup.${TIMESTAMP}"
        warn "Backed up: $target"
    fi

    ln -s "$source" "$target"
}

link_files() {
    local source_dir="$1"
    local target_dir="$2"
    local pattern="${3:-*}"

    for src in "$source_dir"/$pattern; do
        [ -e "$src" ] || continue
        backup_and_link "$src" "$target_dir/$(basename "$src")"
    done
}

cleanup_broken_links() {
    local target_dir="$1"
    [ -d "$target_dir" ] || return
    for link in "$target_dir"/*; do
        [ -L "$link" ] || continue
        if ! [ -e "$link" ]; then
            local dest
            dest="$(readlink "$link")"
            case "$dest" in
                "$REPO_DIR"*) rm "$link" ;;
            esac
        fi
    done
}

# ── 5. Agents, skills, editor integrations ───────────────────────────

# Agents & skills
backup_and_link "$REPO_DIR/agents" "$HOME/.ai-agents/agents"
backup_and_link "$REPO_DIR/skills" "$HOME/.ai-agents/skills"

# OpenCode
backup_and_link "$REPO_DIR/opencode" "$HOME/.ai-agents/opencode"
backup_and_link "$REPO_DIR/opencode/opencode.json" "$HOME/.config/opencode/opencode.json"

# Claude Code commands & rules (per-file)
link_files "$REPO_DIR/claude/commands" "$HOME/.claude/commands" "*.md"
link_files "$REPO_DIR/claude/rules" "$HOME/.claude/rules/common" "*.md"

# Clean up stale symlinks
cleanup_broken_links "$HOME/.claude/commands"
cleanup_broken_links "$HOME/.claude/rules/common"

# ai-manager
backup_and_link "$REPO_DIR/agents" "$HOME/.ai-manager/agents"
backup_and_link "$REPO_DIR/skills" "$HOME/.ai-manager/skills"

ok "Symlinks configured"

# ── 6. Validate ──────────────────────────────────────────────────────

echo ""
info "Validating..."

ERRORS=0
validate() {
    if [ -L "$1" ] && [ -e "$1" ]; then return 0; fi
    warn "Broken: $1"
    ERRORS=$((ERRORS + 1))
}

validate "$HOME/.ai-agents/agents"
validate "$HOME/.ai-agents/skills"
validate "$HOME/.ai-agents/opencode"
validate "$HOME/.config/opencode/opencode.json"
validate "$HOME/.ai-manager/agents"
validate "$HOME/.ai-manager/skills"

for f in "$HOME/.claude/commands"/*.md; do [ -L "$f" ] && validate "$f"; done
for f in "$HOME/.claude/rules/common"/*.md; do [ -L "$f" ] && validate "$f"; done

if [ "$ERRORS" -eq 0 ]; then
    ok "All symlinks valid"
fi

# ── 7. Done ──────────────────────────────────────────────────────────

echo ""
if [ "$ERRORS" -eq 0 ]; then
    printf "${GREEN}${BOLD}  Installation complete.${NC}\n"
else
    printf "${YELLOW}${BOLD}  Installed with %d warning(s).${NC}\n" "$ERRORS"
fi

echo ""
echo "  Get started:"
echo "    cd your-project"
echo "    ai init                  Scan repo and configure editors"
echo "    ai learn -c gotchas \"something useful\"   Add knowledge"
echo "    ai status                Check setup"
echo "    ai dashboard             Open visual dashboard"
echo ""
echo "  Slash commands (Claude Code / OpenCode):"
echo "    /review  /debug  /refactor  /feature  /write-tests  /manage"
echo ""
echo "  To update:"
echo "    curl -fsSL https://raw.githubusercontent.com/asambstack/ai-cli/main/install.sh | bash"
echo ""
