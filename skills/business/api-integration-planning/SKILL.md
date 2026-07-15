---
name: api-integration-planning
description: Use before implementing a third-party API integration — research the API, design the integration layer, identify failure modes, and produce an implementation plan
outputs:
  - plan-ready
  - api-unsuitable
  - needs-auth-design
---

# API Integration Planning

## Overview

Design a clean, maintainable integration with a third-party API before writing implementation code. Covers authentication, data mapping, error handling, rate limiting, and testing strategy.

**Announce at start:** "I'm using the api-integration-planning skill to design this integration."

## The Process

### Step 1: Understand the Integration Goal

Ask (one question at a time):
1. What data or functionality do you need from this API?
2. Which specific API endpoints are needed?
3. How frequently will you call the API? (real-time, batch, webhook-driven)
4. What happens if the API is unavailable — is this blocking or degraded?

### Step 2: Audit the API

Research the API documentation and capture:

```markdown
## API Audit: <API Name>

**Base URL:** <url>
**Authentication:** API key | OAuth2 | JWT | Basic | None
**Rate limits:** <requests/minute or requests/day>
**Pagination:** cursor | offset | page | none
**Webhook support:** yes/no
**API versioning:** <how they handle breaking changes>
**SLA / uptime:** <if documented>
**SDK available:** <language, link>
**Known issues / quirks:** <from community, docs, changelogs>
```

### Step 3: Design the Integration Layer

Define the abstraction layer that will wrap the API:

```
Integration Layer Responsibilities:
1. Authentication (credential management, token refresh)
2. Request construction (URL building, header injection)
3. Response mapping (API response → internal data model)
4. Error classification (retryable vs. fatal errors)
5. Rate limit management (backoff, queuing)
6. Logging and observability
```

For each endpoint needed, define:
- Internal method name (e.g., `getUser`, not `GET /v2/users/{id}`)
- Input parameters (with types)
- Return type (internal model, not raw API response)
- Error cases and how they're surfaced

### Step 4: Define Error Handling Strategy

| Error Type | Example | Strategy |
|------------|---------|---------|
| Retryable | 429 Rate limit, 503 Server error | Exponential backoff with jitter |
| Authentication | 401 Unauthorized | Refresh token once, then fail |
| Not found | 404 | Return null or raise NotFoundError |
| Validation | 422 Unprocessable | Log and raise ValidationError (do not retry) |
| Fatal | 500+ repeated | Circuit breaker; alert; fallback |

### Step 5: Plan Testing Strategy

- **Unit tests**: mock the HTTP client; test response mapping and error classification
- **Integration tests**: use API sandbox/staging environment; test real API behavior
- **Contract tests**: snapshot the API response format; alert when it changes
- **Rate limit tests**: verify backoff logic works correctly

### Step 6: Identify Authentication Design

Determine auth approach:
- **API key**: simple; store in environment variable, never in code
- **OAuth2**: needs token storage, refresh flow, scope management
- **mTLS**: needs certificate management
- **Webhook signature**: needs HMAC verification on incoming requests

### Step 7: Produce Implementation Plan

Call `superpowers:writing-plans` to produce the full implementation plan based on:
- The integration layer design
- The endpoint method definitions
- The error handling and testing strategy

Save API audit to `docs/ai-works/specs/YYYY-MM-DD-<api-name>-integration-design.md`.

### Step 8: Declare Output

- If API is unsuitable (unstable, undocumented, no sandbox, rate limits prohibitive) → output: `api-unsuitable`
- If OAuth2 or complex auth flow needs separate design session → output: `needs-auth-design`
- Otherwise → output: `plan-ready`

## <BRANCH-POINT id="api-viability">

After Step 2:
- If API has no documentation, no versioning, or no sandbox: output = `api-unsuitable` — recommend alternative or custom implementation
- If authentication requires OAuth2 with token storage: output = `needs-auth-design` — design auth separately
- Otherwise: output = `plan-ready` — proceed to integration layer design

</BRANCH-POINT>
