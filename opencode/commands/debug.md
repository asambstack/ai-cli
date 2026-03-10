Launch a debugging agent to diagnose and fix the issue.

Instructions:
1. Reproduce the error — run the failing command/test
2. Read the full error output and stack trace
3. Trace the root cause — check recent changes with `git log` and `git diff`
4. Apply the SMALLEST possible fix
5. Verify the fix — rerun the failing test AND the full test suite

Rules:
- Fix the root cause, not symptoms
- Do NOT refactor surrounding code
- Do NOT change architecture
- One fix per issue

$ARGUMENTS