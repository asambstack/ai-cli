---
name: tdd-workflow
description: TDD methodology with Red-Green-Refactor. Activate when writing new features, fixing bugs, or refactoring.
---

# TDD Workflow

## Steps

1. **Write user journey**: As a [role], I want [action], so that [benefit]
2. **Generate test cases** from the journey (happy path + edge cases)
3. **Run tests** — they MUST fail (RED)
4. **Write minimal code** to make tests pass (GREEN)
5. **Refactor** while keeping tests green (IMPROVE)
6. **Verify coverage** — must be 80%+

## Test Types

- **Unit**: Individual functions, pure logic, utilities
- **Integration**: API endpoints, database operations, service interactions
- **E2E**: Critical user flows via browser automation

## Edge Cases to Always Cover

Null/undefined, empty collections, invalid types, boundary values, error paths, concurrent operations, special characters

## Test Structure (AAA)

```
Arrange — set up test data
Act     — call the function
Assert  — verify the result
```

## Mocking

Mock external dependencies only (databases, APIs, file system). Never mock the code under test.

## Anti-Patterns

- Testing implementation details instead of behavior
- Tests depending on each other (shared mutable state)
- Asserting too little (tests that can never fail)
- Using brittle selectors (CSS classes) instead of semantic ones (roles, test IDs)

## Coverage Thresholds

Branches: 80% | Functions: 80% | Lines: 80% | Statements: 80%
