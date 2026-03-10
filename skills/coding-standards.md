---
name: coding-standards
description: Universal code quality principles. Naming, immutability, error handling, file organization.
---

# Coding Standards

## Principles

1. **Readability first** — code is read more than written
2. **KISS** — simplest solution that works
3. **DRY** — extract common logic, but don't abstract prematurely
4. **YAGNI** — don't build features before they're needed

## Naming

- Variables: descriptive nouns (`marketSearchQuery`, not `q`)
- Functions: verb-noun pattern (`fetchMarketData`, not `market`)
- Booleans: `is`/`has`/`can` prefix (`isAuthenticated`, not `auth`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

## Immutability (CRITICAL)

Always create new objects, never mutate:
- Use spread operator: `{ ...obj, key: newVal }`
- Use array methods: `[...arr, item]`, `.map()`, `.filter()`
- Never: `obj.key = val`, `arr.push(item)`

## Error Handling

- Always handle errors explicitly (no empty catch blocks)
- User-facing: generic messages
- Server-side: detailed logging
- Fail fast: validate at system boundaries

## Functions

- Max 50 lines per function
- Single responsibility
- Early returns to reduce nesting (max 4 levels)

## Files

- Max 800 lines per file
- Organize by feature/domain, not by type
- 200-400 lines typical

## Async

- Use `Promise.all()` for independent parallel operations
- Always handle rejected promises
- Add timeouts to external calls

## Code Smells

- Functions >50 lines → split
- Nesting >4 levels → early returns
- Magic numbers → named constants
- `any` type → proper types
- console.log → remove before merge
