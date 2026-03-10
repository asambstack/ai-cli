---
description: Debug and fix errors - build failures, runtime errors, type errors
---

Launch a debugging agent to diagnose and fix the issue.

Instructions:
1. Load and follow the instructions in ~/.ai-agents/agents/debug-agent.md
2. Reproduce the error — run the failing command/test
3. Read the full error output and stack trace
4. Trace the root cause — check recent changes with `git log` and `git diff`
5. Apply the SMALLEST possible fix
6. Verify the fix — rerun the failing test AND the full test suite

Rules:
- Fix the root cause, not symptoms
- Do NOT refactor surrounding code
- Do NOT change architecture
- One fix per issue

$ARGUMENTS
