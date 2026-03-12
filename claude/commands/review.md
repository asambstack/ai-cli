---
description: Review code changes for security, quality, and correctness
---

Launch a code review agent to review the current changes.

Instructions:
1. Use the Agent tool with subagent_type "Explore" or a general-purpose agent
2. Load and follow the instructions in ~/.ai-agents-repo/agents/review-agent.md
3. Run `git diff --staged` and `git diff` to identify changed code
4. Review ONLY changed code unless a CRITICAL security issue exists nearby
5. Output findings by severity: CRITICAL > HIGH > MEDIUM > LOW
6. End with a summary table and verdict (APPROVE / WARNING / BLOCK)

Focus on: hardcoded secrets, injection vulnerabilities, missing error handling, mutation patterns, dead code.

Only report issues with >80% confidence. Consolidate similar findings.

$ARGUMENTS
