---
description: Diagnose and fix a failing service in the local dev environment (Tilt)
---

Diagnose and fix a failing service in the local Tilt-managed dev environment.

Instructions:
1. Load the dev-environment skill from ~/.ai-agents-repo/skills/dev-environment.md
2. If the user did not specify a service name in $ARGUMENTS, ask: "Which service is failing? (check Tilt UI at http://localhost:10350 for red resources)"
3. Once you have the service name, run `tilt logs <service>` to get the last 100 lines
4. Before attempting a fix, ask clarifying questions:
   - "Did this service work before, or is this a first-time setup?"
   - "Did you change anything recently in this repo?" (check with `git -C <repo> log --oneline -5`)
   - Any other questions based on what the logs reveal
5. Diagnose the root cause using the logs, the skill's troubleshooting playbook, and the service map
6. Apply the fix:
   - If it's a config issue → fix the config file or Tiltfile
   - If it's a missing dependency → run npm install / bundle install
   - If it's a code issue → fix the code with minimal changes
   - If it's an infrastructure issue (DB down, port conflict) → guide the user to resolve it
7. After fixing, verify the service is healthy:
   - Check `tilt logs <service>` for clean startup
   - Check the readiness probe passes
8. If you learned something new, append it to the "Learned Knowledge" section in ~/.ai-agents-repo/skills/dev-environment.md

Rules:
- Always read logs BEFORE guessing at a fix
- Ask clarifying questions — don't assume
- Fix the root cause, not symptoms
- If unsure, propose the fix and ask for confirmation before applying
- Do NOT restart unrelated services
- Update the Tiltfile if the fix involves a config/port/dependency change
- Update the skill file if you discover a new troubleshooting pattern

$ARGUMENTS
