---
name: security-review
description: Security checklist for auth, user input, API endpoints, secrets, and sensitive features.
---

# Security Review

## Activate When

Implementing auth, handling user input, creating API endpoints, working with secrets, payment features, sensitive data.

## Checklist

### Secrets Management
- [ ] No hardcoded API keys, tokens, or passwords in source
- [ ] All secrets in environment variables
- [ ] `.env*` files in .gitignore
- [ ] Secrets validated at startup (fail fast if missing)
- [ ] No secrets in git history

### Input Validation
- [ ] All user inputs validated with schemas (zod, pydantic, etc.)
- [ ] File uploads restricted (size, type, extension)
- [ ] No direct use of user input in queries or shell commands
- [ ] Whitelist validation (not blacklist)
- [ ] Error messages don't leak internals

### SQL Injection
- [ ] All queries use parameterized queries or ORM
- [ ] No string concatenation in SQL

### Authentication & Authorization
- [ ] Tokens in httpOnly cookies (not localStorage)
- [ ] Auth checks on every protected route
- [ ] Role-based access control implemented
- [ ] Row Level Security enabled (if applicable)

### XSS Prevention
- [ ] User-provided HTML sanitized (DOMPurify or equivalent)
- [ ] CSP headers configured
- [ ] No unvalidated dynamic content rendering

### CSRF Protection
- [ ] CSRF tokens on state-changing operations
- [ ] SameSite=Strict on cookies

### Rate Limiting
- [ ] Rate limiting on all public API endpoints
- [ ] Stricter limits on expensive operations (search, uploads)

### Data Exposure
- [ ] No passwords, tokens, or PII in logs
- [ ] Generic error messages for users, detailed in server logs only
- [ ] No stack traces exposed to clients

### Dependencies
- [ ] `npm audit` / `pip audit` clean
- [ ] Lock files committed
- [ ] No known vulnerable packages

## Pre-Deployment Gate

ALL boxes above must be checked before merge to production.
