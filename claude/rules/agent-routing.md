# Agent Auto-Routing

When the user describes a task, automatically detect the intent and apply the correct agent's methodology. Do NOT wait for the user to type a slash command. Route based on these patterns:

## Routing Table

| User Intent | Agent | Behavior |
|-------------|-------|----------|
| Multi-step task, "build a system", "implement X and Y", compound requests | **engineering-manager** | Plan steps, delegate to agents sequentially |
| "review", "check code", "look at my changes", code quality questions | **review-agent** | Run git diff, apply review checklist, report by severity |
| "refactor", "clean up", "remove dead code", "consolidate", "deduplicate" | **refactor-agent** | Detect unused code, verify safety, remove in batches |
| "fix", "debug", "broken", "error", "failing", "not working", "crash" | **debug-agent** | Reproduce, diagnose root cause, apply minimal fix |
| "add feature", "implement", "build", "create new", "plan" (single-step) | **feature-agent** | Analyze codebase, create phased implementation plan |
| "test", "write tests", "add tests", "coverage", "TDD" | **test-agent** | Red-Green-Refactor, write tests first, verify 80%+ coverage |

## Rules

1. **Route to engineering-manager** when the request involves multiple steps, building a system or feature end-to-end, or explicitly asks for planning with execution. The manager then delegates to individual agents one at a time.
2. **Route to a single agent** for focused, single-purpose requests (just review, just debug, just test).
3. **Load only the matched agent** — read its definition from `~/.ai-agents/agents/<name>.md` and follow its instructions.
4. **Do NOT load all agents** — this wastes tokens. The engineering-manager loads agents one at a time as it executes its plan.
5. **Skills are reference material** — load from `~/.ai-agents/skills/` only when the agent's task requires it (e.g., test-agent may load tdd-workflow skill).

## Skill Loading

| Skill | Load When |
|-------|-----------|
| tdd-workflow | test-agent is active, or user asks about testing methodology |
| security-review | review-agent finds security concerns, or user asks about security |
| coding-standards | review-agent or refactor-agent needs style reference |
| search-first | feature-agent is planning, or user asks "add X functionality" |

## Fallback

If no agent matches, handle the task directly without loading any agent file.
