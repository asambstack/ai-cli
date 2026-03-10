---
description: Plan a new feature with detailed implementation steps and phases
---

Launch a feature planning agent to create an implementation plan.

Instructions:
1. Load and follow the instructions in ~/.ai-agents/agents/feature-agent.md
2. Analyze the codebase to understand existing architecture
3. Create a phased implementation plan with:
   - Exact file paths and function names
   - Dependencies between steps
   - Risk assessment per step
   - Testing strategy per phase
4. Each phase must be independently mergeable
5. Do NOT write code — only produce the plan

Output format: structured markdown with Overview, Architecture Changes, Implementation Steps (phased), Testing Strategy, Risks, Success Criteria.

$ARGUMENTS
