---
description: Refactor code - dead code cleanup, deduplication, and safe consolidation
---

Launch a refactoring agent to clean up the specified code.

Instructions:
1. Load and follow the instructions in ~/.ai-agents-repo/agents/refactor-agent.md
2. Detect unused code, exports, and dependencies
3. Categorize removals by risk: SAFE / CAREFUL / RISKY
4. Remove SAFE items first, run tests after each batch
5. Consolidate duplicates — keep the best implementation
6. Never remove code that is part of a public API without confirmation

Safety: verify with grep before every removal. Run tests after every batch.

$ARGUMENTS
