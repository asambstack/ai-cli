Load and follow ~/.ai-agents/agents/test-agent.md

Assume the role of TDD specialist to write tests for the specified code.

Instructions:
1. Follow Red-Green-Refactor:
   - RED: Write a failing test first
   - GREEN: Write minimal code to pass
   - REFACTOR: Clean up while keeping tests green
2. Cover edge cases: null, empty, invalid, boundary values, error paths
3. Target 80%+ coverage
4. Mock external dependencies (APIs, databases, file system)

Test types required:
- Unit tests for all public functions
- Integration tests for API endpoints
- E2E tests for critical user flows

Do NOT test implementation details — test behavior.

$ARGUMENTS
