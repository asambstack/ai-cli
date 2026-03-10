Launch a code review agent to review the current changes.

Instructions:
1. Run `git diff --staged` and `git diff` to identify changed code
2. Review ONLY changed code unless a CRITICAL security issue exists nearby
3. Output findings by severity: CRITICAL > HIGH > MEDIUM > LOW
4. End with a summary table and verdict (APPROVE / WARNING / BLOCK)

Focus on: hardcoded secrets, injection vulnerabilities, missing error handling, mutation patterns, dead code.
Only report issues with >80% confidence. Consolidate similar findings.

$ARGUMENTS