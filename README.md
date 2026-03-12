# ai-agents

One command to set up a full AI agent system across Claude Code, OpenCode, Cursor, Windsurf, Copilot, Cline, and Aider. Includes a CLI for repo context management and a visual dashboard.

```bash
curl -fsSL https://raw.githubusercontent.com/asambstack/ai-cli/main/install.sh | bash
```

Requires git and Node.js 18+. Works on macOS and Linux.

---

## What you get

### Agents

Six specialized agents that handle different development tasks. Describe your task in natural language — the correct agent is selected automatically.

| Agent | What it does |
|-------|-------------|
| `engineering-manager` | Breaks compound tasks into steps, delegates to specialist agents, parallelizes independent work |
| `review-agent` | Security, quality, and correctness review on diffs |
| `refactor-agent` | Dead code removal, deduplication, safe consolidation |
| `debug-agent` | Root cause diagnosis and minimal fix |
| `feature-agent` | Phased implementation plan with dependency analysis |
| `test-agent` | TDD workflow — tests first, 80%+ coverage target |

### Skills

Seven methodology guides loaded on demand when agents need them:

`tdd-workflow` `security-review` `coding-standards` `search-first` `git-workflow` `design-patterns` `hooks-guide`

### Slash commands

Available in Claude Code and OpenCode:

```
/review       /debug       /refactor
/feature      /write-tests /manager
```

### Global rules

Seven always-on rules for Claude Code: coding style, security, testing, performance, development workflow, agent routing, and agent orchestration.

### `ai` CLI

Static analysis tool that scans your repo and generates context files for AI editors. No LLM calls, no API costs.

```bash
ai init                          # scan repo, pick editors, generate context
ai init --editors claude,cursor  # configure specific editors
ai learn -c gotchas "text"       # add project knowledge
ai refresh                       # re-scan and regenerate context
ai status                        # show setup and staleness
ai dashboard                     # open visual dashboard
```

Generates `.ai/context.md` and symlinks it to each editor's context file (CLAUDE.md, .cursorrules, etc.). One file to maintain — every editor reads it.

### Dashboard

Browser-based UI at `localhost:3141` for monitoring repo health, managing knowledge, and editing agent configs. Built with Hono + htmx, no client framework.

---

## How it works

### Architecture

The repository is the single source of truth. Symlinks connect it to each tool:

```
~/.ai-agents-repo/
    claude/commands/*.md ─────→ ~/.claude/commands/*.md
    claude/rules/*.md ────────→ ~/.claude/rules/common/*.md
    opencode/opencode.json ───→ ~/.config/opencode/opencode.json
```

### Context generation

`ai init` performs static analysis — reads package.json, Gemfile, pyproject.toml, go.mod, Cargo.toml, scans directory structure, checks git history. Zero tokens consumed. The output is a structured markdown file covering:

- Languages, frameworks, test runners, build tools
- Directory structure with descriptions
- Entry points, dependencies, scripts
- Project knowledge (persisted across refreshes)
- Link to workspace context (sibling repos)

### Supported editors

| Editor | Context file | Symlinked from |
|--------|-------------|----------------|
| Claude Code | `CLAUDE.md` | `.ai/context.md` |
| OpenCode | `.opencode/instructions.md` | `.ai/context.md` |
| Cursor | `.cursorrules` | `.ai/context.md` |
| Windsurf | `.windsurfrules` | `.ai/context.md` |
| GitHub Copilot | `.github/copilot-instructions.md` | `.ai/context.md` |
| Cline | `.clinerules` | `.ai/context.md` |
| Aider | `CONVENTIONS.md` | `.ai/context.md` |

### Agent delegation model

1. `engineering-manager` receives compound tasks and creates a 2-5 step plan
2. Each step is tagged with a specialist agent
3. Independent steps run in parallel; dependent steps run sequentially
4. Skills are loaded on demand when an agent needs reference material
5. Every non-trivial change ends with `review-agent`

For single-purpose requests, routing dispatches directly to the appropriate agent.

### Learning categories

```
architecture    system design, patterns, data flow
conventions     naming, style, file organization
gotchas         known issues, quirks, workarounds
integrations    external services, APIs
domain          business logic, key concepts
```

---

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/asambstack/ai-cli/main/install.sh | bash
```

The installer clones the repository, builds the CLI and dashboard, and creates all symlinks. Existing files are backed up before replacement.

### Prerequisites

- macOS or Linux
- git
- Node.js 18+

### Update

Run the same install command — it detects the existing installation and pulls latest changes:

```bash
curl -fsSL https://raw.githubusercontent.com/asambstack/ai-cli/main/install.sh | bash
```

### Uninstall

```bash
~/.ai-agents-repo/uninstall.sh
```

Removes all symlinks, unlinks the `ai` CLI from PATH, and deletes the repository. Prompts for confirmation before proceeding.

To also remove all `.ai/` folders created by `ai init` in your repos:

```bash
~/.ai-agents-repo/uninstall.sh --purge
```

The `--purge` flag scans for `.ai/` directories, shows each one with its contents, and asks for a second confirmation before deleting. Only removes directories that contain files created by this tool (`config.json`, `context.md`, `learnings.md`, or `workspace.md` symlink). Editor symlinks (CLAUDE.md, .cursorrules, etc.) that point into `.ai/` are also cleaned up.

### Custom install

```bash
# Custom install directory
AI_AGENTS_DIR=~/my-agents curl -fsSL https://raw.githubusercontent.com/.../install.sh | bash

# Private fork
AI_AGENTS_REPO=git@github.com:myorg/ai-cli.git bash install.sh
```

---

## Repository structure

```
ai-agents/
├── agents/                 6 agent definitions (.md)
├── skills/                 7 methodology guides (.md)
├── claude/
│   ├── commands/           6 slash commands
│   └── rules/              7 global rules
├── opencode/               OpenCode config + prompts
├── cli/                    ai CLI (TypeScript)
│   └── src/
│       ├── scanner.ts      Static repo analysis
│       ├── generator.ts    context.md generation
│       ├── editors.ts      Symlink management
│       ├── scanners/       Node, Python, Ruby, Go, Rust
│       └── commands/       init, learn, refresh, status
├── dashboard/              Visual dashboard (Hono + htmx)
│   └── src/
│       ├── server.tsx      Entry point (localhost:3141)
│       ├── routes/         API + page routes
│       ├── services/       File I/O layer
│       └── views/          JSX components
├── install.sh              One-command installer
├── uninstall.sh            Clean removal
└── README.md
```

## Adding a new agent

1. Create `agents/<name>.md` with the agent definition
2. Create `opencode/prompts/agents/<name>.txt` with a compressed prompt
3. Add a Claude command in `claude/commands/<command>.md`
4. Add an OpenCode command in `opencode/commands/<command>.md`
5. Register in `opencode/opencode.json`
6. Update routing in `claude/rules/agent-routing.md` and `opencode/instructions.md`
7. Push — teammates get it on next update
