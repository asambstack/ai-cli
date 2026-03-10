---
description: Write tests using TDD methodology - tests first, then implementation
---

Launch a TDD agent to write tests for the specified code.

Instructions:
1. Load and follow the instructions in ~/.ai-agents/agents/test-agent.md
2. Follow Red-Green-Refactor:
   - RED: Write a failing test first
   - GREEN: Write minimal code to pass
   - REFACTOR: Clean up while keeping tests green
3. Cover edge cases: null, empty, invalid, boundary values, error paths
4. Target 80%+ coverage
5. Mock external dependencies (APIs, databases, file system)

Test types required:
- Unit tests for all public functions
- Integration tests for API endpoints
- E2E tests for critical user flows

Do NOT test implementation details — test behavior.

$ARGUMENTS
