# ai-agents

Portable AI agent environment for Claude Code, OpenCode, and ai-manager. One repository, one install command — full agent system across all three runtimes.

## What this provides

**6 specialized agents** that handle different development tasks:

| Agent | Purpose | Model |
|-------|---------|-------|
| engineering-manager | Orchestrates multi-step tasks by delegating to other agents | Sonnet |
| review-agent | Code review for security, quality, and correctness | Sonnet |
| refactor-agent | Dead code cleanup, deduplication, safe consolidation | Sonnet |
| debug-agent | Root cause diagnosis and minimal fixes | Sonnet |
| feature-agent | Feature planning with phased implementation steps | Opus |
| test-agent | TDD specialist — write tests first, 80%+ coverage | Sonnet |

**4 reusable skills** loaded on demand by agents:

| Skill | Used by |
|-------|---------|
| tdd-workflow | test-agent, any TDD context |
| security-review | review-agent when security concerns found |
| coding-standards | review-agent, refactor-agent for style reference |
| search-first | feature-agent during planning phase |

**Auto-routing** — describe your task in natural language and the correct agent is selected automatically. No slash command required.

**6 slash commands** available in both Claude Code and OpenCode:

```
/review       — review current changes
/debug        — diagnose and fix an error
/refactor     — clean up and consolidate code
/feature      — plan a new feature
/write-tests  — write tests using TDD
/manage       — orchestrate a multi-step task
```

**10 global rules** for Claude Code covering coding style, security, testing, git workflow, performance, and more.

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

### ai-manager integration

- `~/.ai-manager/agents` and `~/.ai-manager/skills` are directory symlinks to `repo/agents` and `repo/skills`.
- The ai-manager's `opencodeLoader.ts` scans these directories with `readdir`, which transparently follows symlinks.
- Usage: `ai "your task here"` from any git repository.

### Agent system

Agents follow a delegation model:

1. **engineering-manager** receives compound tasks and creates a 2-5 step plan
2. Each step is tagged with a specialist agent (debug, feature, test, refactor, review)
3. Agents execute sequentially — only one loaded at a time
4. Skills are loaded on demand when an agent needs reference material
5. Every non-trivial change ends with review-agent

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
│   ├── search-first.md
│   ├── security-review.md
│   └── tdd-workflow.md
├── claude/
│   ├── commands/               # Claude Code slash commands
│   │   ├── debug.md
│   │   ├── feature.md
│   │   ├── manage.md
│   │   ├── refactor.md
│   │   ├── review.md
│   │   └── write-tests.md
│   └── rules/                  # Claude Code global rules
│       ├── agent-routing.md
│       ├── agents.md
│       ├── coding-style.md
│       ├── development-workflow.md
│       ├── git-workflow.md
│       ├── hooks.md
│       ├── patterns.md
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
