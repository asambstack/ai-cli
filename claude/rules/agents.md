# Agent Orchestration

## Available Agents

Located in `~/.ai-agents-repo/agents/`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| engineering-manager | Orchestrate multi-step tasks | Compound requests, system-level features |
| feature-agent | Implementation planning | New features, architectural changes |
| debug-agent | Root cause diagnosis | Bug fixes, errors, failures |
| test-agent | Test-driven development | New features, bug fixes |
| review-agent | Code review + security | After writing code, before commits |
| refactor-agent | Dead code cleanup | Code maintenance, consolidation |

## Immediate Agent Usage

No user prompt needed:
1. Complex multi-step requests — Use **engineering-manager**
2. New feature or architectural change — Use **feature-agent**
3. Code just written/modified — Use **review-agent**
4. Bug fix or error — Use **debug-agent**
5. Writing tests — Use **test-agent**

## Parallel Task Execution

ALWAYS use parallel Task execution for independent operations:

```markdown
# GOOD: Parallel execution
Launch 3 agents in parallel:
1. Agent 1: Security analysis of auth module
2. Agent 2: Performance review of cache system
3. Agent 3: Type checking of utilities

# BAD: Sequential when unnecessary
First agent 1, then agent 2, then agent 3
```
