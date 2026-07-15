---
name: technical-writing
description: Use when turning implementation notes, code comments, or rough drafts into clean technical documentation — audience-appropriate, structured, and complete
outputs:
  - draft-complete
  - needs-review
---

# Technical Writing

## Overview

Transform rough implementation notes, code, or verbal descriptions into clean, structured technical documentation appropriate for the intended audience.

**Announce at start:** "I'm using the technical-writing skill to produce this documentation."

## When to Use

- Turning PR descriptions into release notes
- Converting implementation notes into API documentation
- Writing README files from code
- Producing runbooks from operational procedures
- Creating onboarding guides from institutional knowledge

## The Process

### Step 1: Identify Audience and Document Type

Determine:
- **Primary audience**: developers, ops, end users, managers
- **Document type**: API reference, README, runbook, guide, release notes, ADR
- **Where it lives**: code repo, internal wiki, public docs site, email

### Step 2: Gather Source Material

Collect all available sources:
- Implementation notes, code files, PR descriptions
- Existing documentation (to update, not duplicate)
- Any verbal description or bullet points provided

Read everything before writing a word.

### Step 3: Structure the Document

Before writing prose, produce an outline. Standard outlines by document type:

**README:**
```
1. What it does (1-2 sentences)
2. Quick start / installation
3. Usage examples (real code)
4. Configuration reference
5. Contributing / development setup
6. License
```

**API Reference:**
```
For each endpoint:
  - Method and path
  - Description
  - Request parameters (table: name, type, required, description)
  - Request body (if any, with example)
  - Response (status codes, body schema, example)
  - Error codes
```

**Runbook:**
```
1. Purpose / when to use this runbook
2. Prerequisites
3. Steps (numbered, with commands and expected output)
4. Verification
5. Rollback procedure
6. Contact / escalation
```

**Release Notes:**
```
1. Version and date
2. Summary (1 sentence)
3. New features (user-facing)
4. Bug fixes
5. Breaking changes (if any, with migration instructions)
6. Deprecations (if any)
```

### Step 4: Write the Document

Rules:
- **Active voice**: "Run the migration" not "The migration should be run"
- **Imperative for instructions**: "Install dependencies" not "You should install dependencies"
- **Show, don't tell**: real code examples > descriptions of what code does
- **Specific over vague**: "Responds in < 50ms" not "Responds quickly"
- **Define acronyms on first use**
- **One idea per paragraph** — if it's getting long, it should be split or moved to a separate section

For code samples:
- Always include language identifier in fenced code blocks
- Show the minimum working example, not a complex one
- Include imports and setup if they're non-obvious

### Step 5: Self-Review

After drafting, check:
- [ ] Every step in an instruction is specific and unambiguous
- [ ] Every code sample is tested/accurate
- [ ] Prerequisites are listed before the first step that needs them
- [ ] No unexplained jargon for the target audience
- [ ] No passive voice in instructions
- [ ] Document has a title and is correctly dated

### Step 6: Declare Output

- If key information is missing (can't write the security section without knowing the auth model) → output: `needs-review` — flag what's missing
- If draft is complete → output: `draft-complete`
