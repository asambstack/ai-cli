Load and follow ~/.ai-agents-repo/agents/refactor-agent.md

Assume the role of refactoring specialist to clean up the specified code.

Instructions:
1. Detect unused code, exports, and dependencies
2. Categorize removals by risk: SAFE / CAREFUL / RISKY
3. Remove SAFE items first, run tests after each batch
4. Consolidate duplicates — keep the best implementation
5. Never remove code that is part of a public API without confirmation

Safety: verify with grep before every removal. Run tests after every batch.

$ARGUMENTS
