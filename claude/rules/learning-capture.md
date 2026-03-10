# Learning Capture

At the end of a task, if you discovered something important about this project that isn't already documented in the context, capture it.

## What to capture

- Architecture patterns, data flow, service relationships
- Conventions not documented elsewhere (naming, error handling, patterns)
- Gotchas, quirks, or non-obvious behavior
- External service integrations and how they connect
- Domain knowledge (business logic, key concepts)

## How to capture

Run this command at the end of your task:

```bash
ai learn -c <category> "<what you learned>"
```

Categories: architecture, conventions, gotchas, integrations, domain

## Rules

- Only capture knowledge that would help future sessions
- Do not capture session-specific details (current task, temporary state)
- Do not duplicate information already in .ai/context.md
- One learning per command — keep each entry concise (one sentence)
- Do this at the end of a task, not during
