---
name: search-first
description: Research before coding. Search for existing tools, libraries, and patterns before writing custom code.
---

# Search First

## When to Activate

Before writing any new utility, helper, abstraction, or integration.

## Quick Checklist

0. Does this already exist in the repo? → grep/search first
1. Is this a common problem? → Search package registries (npm, PyPI, crates.io)
2. Is there an MCP server for this? → Check available tools
3. Is there a GitHub implementation? → Search for maintained OSS
4. Can we compose existing packages? → Prefer composition over custom code

## Decision Matrix

| Signal | Action |
|--------|--------|
| Exact match, well-maintained, permissive license | **Adopt** — install and use directly |
| Partial match, good foundation | **Extend** — install + write thin wrapper |
| Multiple weak matches | **Compose** — combine small packages |
| Nothing suitable found | **Build** — write custom, informed by research |

## Anti-Patterns

- Jumping to code without checking if a solution exists
- Wrapping a library so heavily it loses its benefits
- Installing a massive package for one small feature
- Ignoring MCP tools that already provide the capability
