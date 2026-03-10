# Agent Auto-Routing

When the user describes a task, automatically detect the intent and apply the correct agent. Do NOT wait for a slash command. Route based on these patterns:

| User Intent | Agent |
|-------------|-------|
| Multi-step task, "build a system", compound requests | engineering-manager |
| "review", "check code", "look at my changes" | review-agent |
| "refactor", "clean up", "remove dead code", "consolidate" | refactor-agent |
| "fix", "debug", "broken", "error", "failing", "not working" | debug-agent |
| "add feature", "implement", "build", "create new", "plan" | feature-agent |
| "test", "write tests", "add tests", "coverage", "TDD" | test-agent |

## Rules

1. Route to **engineering-manager** for multi-step or compound tasks. It delegates to individual agents.
2. Route to a **single agent** for focused, single-purpose requests.
3. Load only the matched agent — do not load all agents at once.
4. If no agent matches, handle the task directly.
