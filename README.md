# ai-agents

Portable AI agent environment for Claude Code, OpenCode, Cursor, and other AI editors. One repository, one install command — full agent system with repo context management.

## What this provides

**6 specialized agents** that handle different development tasks:

| Agent | Purpose |
|-------|---------|
| engineering-manager | Orchestrates multi-step tasks, parallelizes independent steps, delegates to agents |
| review-agent | Code review for security, quality, and correctness |
| refactor-agent | Dead code cleanup, deduplication, safe consolidation |
| debug-agent | Root cause diagnosis and minimal fixes |
| feature-agent | Feature planning with phased implementation steps |
| test-agent | TDD specialist — write tests first, 80%+ coverage |

**7 reusable skills** loaded on demand by agents:

| Skill | Used by |
|-------|---------|
| tdd-workflow | test-agent, any TDD context |
| security-review | review-agent when security concerns found |
| coding-standards | review-agent, refactor-agent for style reference |
| search-first | feature-agent during planning phase |
| git-workflow | any agent during commit or PR operations |
| design-patterns | feature-agent when architectural patterns needed |
| hooks-guide | any agent configuring hooks or using TodoWrite |

**Auto-routing** — describe your task in natural language and the correct agent is selected automatically. No slash command required.

**6 slash commands** available in both Claude Code and OpenCode:

```
/review       — review current changes
/debug        — diagnose and fix an error
/refactor     — clean up and consolidate code
/feature      — plan a new feature
/write-tests  — write tests using TDD
/manager      — orchestrate a multi-step task
```

**7 global rules** for Claude Code covering coding style, security, testing, performance, and more. 3 former rules (git-workflow, patterns, hooks) moved to on-demand skills to reduce context window usage.

**`ai` CLI** for per-repo context management:

```
ai init                       Scan repo, pick editors, generate context
ai init --all                 Configure all editors (non-interactive)
ai init --editors claude,cursor  Configure specific editors only
ai learn "uses CQRS pattern"  Add project knowledge (interactive category)
ai learn -c gotchas "text"    Add to specific category
ai refresh                    Re-scan repo, regenerate context
ai status                     Show setup, staleness, active editors
```

Generates a single `.ai/context.md` and symlinks it to every selected editor's context file (CLAUDE.md, .cursorrules, .opencode/instructions.md, etc.).

## Install

```bash
git clone git@github.com:<org>/ai-agents.git ~/.ai-agents-repo
cd ~/.ai-agents-repo
chmod +x install.sh
./install.sh
```

The installer creates symlinks from the repository into the locations expected by each tool. It backs up any existing files before replacing them.

### Prerequisites

- macOS or Linux
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (for Claude integration)
- [OpenCode](https://opencode.ai) (for OpenCode integration)
- [ai-manager](https://github.com/<org>/ai-manager) (optional, for CLI orchestration)

## Update

```bash
cd ~/.ai-agents-repo
git pull
```

Because everything is symlinked, pulling new content makes it available immediately. No reinstall needed.

## Uninstall

```bash
cd ~/.ai-agents-repo
./uninstall.sh
```

Removes all symlinks created by the installer. Does not delete the repository or any backups.

## How it works

### Architecture

The repository is the single source of truth. Symlinks connect it to each tool's expected locations:

```
~/.ai-agents-repo/                    (this repository)
    agents/*.md ─────────────────┬──→ ~/.ai-agents/agents/
    skills/*.md ─────────────────┼──→ ~/.ai-agents/skills/
                                 ├──→ ~/.ai-manager/agents/
                                 └──→ ~/.ai-manager/skills/
    claude/commands/*.md ──────────→ ~/.claude/commands/*.md
    claude/rules/*.md ────────────→ ~/.claude/rules/common/*.md
    opencode/ ──────────────────┬──→ ~/.ai-agents/opencode/
    opencode/opencode.json ─────└──→ ~/.config/opencode/opencode.json
```

### Claude Code integration

- **Commands** are per-file symlinks in `~/.claude/commands/`. Each command tells Claude to load the corresponding agent definition from `~/.ai-agents/agents/`.
- **Rules** are per-file symlinks in `~/.claude/rules/common/`. Claude loads all rules automatically on every session. The `agent-routing.md` rule enables intent-based auto-routing.
- Adding personal commands or rules alongside the symlinks works — per-file linking avoids conflicts.

### OpenCode integration

- The global config at `~/.config/opencode/opencode.json` (symlinked from repo) defines all agents and commands.
- Agent prompts use `{file:~/.ai-agents/opencode/prompts/agents/*.txt}` syntax, which resolves through the `~/.ai-agents/opencode` symlink back to the repo.
- The `instructions.md` file provides auto-routing so OpenCode picks agents from natural language.
- Works from any directory — no per-project `.opencode/` setup needed.

### `ai` CLI — repo context manager

The `ai` command is a repo preparation tool. It scans your project and generates context files that AI editors read on startup.

```bash
cd ~/my-project
ai init               # scan, pick editors, generate .ai/context.md + symlinks
ai learn -c architecture "microservices with event bus"
ai status             # show setup, staleness warning if >20 commits behind
ai refresh            # re-scan, regenerate, preserve learnings
```

**What `ai init` detects (static analysis, zero tokens):**
- Languages, frameworks, test runners, build tools (from manifests)
- Directory structure with semantic labels
- Entry points, CI/CD, config files
- Git activity (most-changed directories)

**Supported editors:**

| Editor | Context file |
|---|---|
| Claude Code | `CLAUDE.md` |
| OpenCode | `.opencode/instructions.md` |
| Cursor | `.cursorrules` |
| Windsurf | `.windsurfrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Cline | `.clinerules` |
| Aider | `CONVENTIONS.md` |

All are symlinks to `.ai/context.md` — one file to maintain, every editor reads it.

**Learning categories for `ai learn`:**
- `architecture` — system design, patterns, data flow
- `conventions` — naming, style, file organization
- `gotchas` — known issues, quirks, workarounds
- `integrations` — external services, APIs
- `domain` — business logic, key concepts

### Agent system

Agents follow a delegation model:

1. **engineering-manager** receives compound tasks and creates a 2-5 step plan
2. Each step is tagged with a specialist agent (debug, feature, test, refactor, review)
3. Independent steps execute in parallel via subagents; dependent steps run sequentially
4. Checkpoint after parallel joins — verify all branches succeeded before moving on
5. Skills are loaded on demand when an agent needs reference material
6. Every non-trivial change ends with review-agent

For single-purpose requests (just review, just debug), the routing system dispatches directly to the appropriate agent without going through the manager.

## Repository structure

```
ai-agents/
├── agents/                     # Canonical agent definitions
│   ├── debug-agent.md
│   ├── engineering-manager.md
│   ├── feature-agent.md
│   ├── refactor-agent.md
│   ├── review-agent.md
│   └── test-agent.md
├── skills/                     # Reusable methodology guides
│   ├── coding-standards.md
│   ├── design-patterns.md
│   ├── git-workflow.md
│   ├── hooks-guide.md
│   ├── search-first.md
│   ├── security-review.md
│   └── tdd-workflow.md
├── claude/
│   ├── commands/               # Claude Code slash commands
│   │   ├── debug.md
│   │   ├── feature.md
│   │   ├── manager.md
│   │   ├── refactor.md
│   │   ├── review.md
│   │   └── write-tests.md
│   └── rules/                  # Claude Code global rules (7 always-on)
│       ├── agent-routing.md
│       ├── agents.md
│       ├── coding-style.md
│       ├── development-workflow.md
│       ├── performance.md
│       ├── security.md
│       └── testing.md
├── opencode/
│   ├── opencode.json           # Agent and command definitions
│   ├── instructions.md         # Auto-routing rules
│   ├── commands/               # Command templates
│   │   └── *.md
│   └── prompts/agents/         # Compressed agent prompts
│       └── *.txt
├── cli/                        # ai CLI tool (repo context manager)
│   ├── src/
│   │   ├── cli.ts              # Entry point and command routing
│   │   ├── scanner.ts          # Static repo analysis
│   │   ├── generator.ts        # context.md generation
│   │   ├── editors.ts          # Editor detection and symlink management
│   │   ├── types.ts            # Type definitions
│   │   ├── scanners/           # Per-language scanners
│   │   │   ├── node.ts
│   │   │   ├── python.ts
│   │   │   ├── ruby.ts
│   │   │   ├── go.ts
│   │   │   └── rust.ts
│   │   └── commands/           # CLI command implementations
│   │       ├── init.ts
│   │       ├── learn.ts
│   │       ├── refresh.ts
│   │       └── status.ts
│   ├── package.json
│   └── tsconfig.json
├── install.sh
├── uninstall.sh
└── README.md
```

## Adding a new agent

1. Create `agents/<name>.md` with the agent definition
2. Create `opencode/prompts/agents/<name>.txt` with a compressed prompt version
3. Add a Claude command in `claude/commands/<command>.md` referencing the agent
4. Add an OpenCode command in `opencode/commands/<command>.md`
5. Register the agent and command in `opencode/opencode.json`
6. Update routing tables in `claude/rules/agent-routing.md` and `opencode/instructions.md`
7. Commit and push — teammates get the new agent on `git pull`
