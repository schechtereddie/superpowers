---
name: project-kickoff
description: Use when starting a new project — define scope, create the initial task breakdown, set up tracking structure, and identify stakeholders and success criteria
outputs:
  - kickoff-complete
  - needs-requirements
---

# Project Kickoff

## Overview

Establish a new project's foundation: scope, stakeholders, success criteria, initial task breakdown, and tracking structure.

**Announce at start:** "I'm using the project-kickoff skill to set up this project."

## The Process

### Step 1: Establish Project Identity

Gather (ask one question at a time if interactive):
1. Project name and one-sentence purpose
2. Primary stakeholders and their roles (sponsor, team, users)
3. Project start date and target completion (or "ongoing")
4. Budget/resource constraints (if any)

### Step 2: Define Success Criteria

Ask: "How will you know this project succeeded?"

Push for measurable, specific criteria:
- ✅ "All users can log in with SSO by March 15"
- ✅ "API response times < 200ms at 1000 req/sec"
- ❌ "Users are happy" (too vague)
- ❌ "The system works well" (not measurable)

Capture 2–5 success criteria.

### Step 3: Establish Scope Boundary

Explicitly define what is **in scope** and what is **out of scope**:

```
In scope:
- <item>

Out of scope (explicitly excluded):
- <item>

Deferred (may be added in phase 2):
- <item>
```

This step prevents scope creep. If your human partner resists the "out of scope" section, ask: "If we can't do everything, what would you cut first?"

### Step 4: Identify Risks and Assumptions

List 3–5 key risks and the assumptions the project depends on:

```
Risks:
- <risk> (likelihood: H/M/L, impact: H/M/L)

Assumptions:
- <assumption that must be true for the project to succeed>
```

### Step 5: Create Initial Task Breakdown

Break the project into 3–7 phases or epics (not individual tasks). For each:
- Name and purpose
- Key deliverable
- Rough duration estimate
- Dependencies on other phases

Use the plan format:
```
Phase 1: Foundation (2 weeks)
  Deliverable: Working dev environment + CI pipeline
  Depends on: Nothing

Phase 2: Core Feature (3 weeks)
  Deliverable: Feature X implemented and tested
  Depends on: Phase 1
```

### Step 6: Set Up Tracking Structure

Create:
- `docs/ai-works/projects/<project-slug>/README.md` — project charter
- `docs/ai-works/projects/<project-slug>/tasks.md` — running task list
- Git tag: `project-start/<project-slug>` on the current commit

Project charter template:
```markdown
# <Project Name>

**Purpose:** <one sentence>
**Sponsor:** <name>
**Team:** <names>
**Start:** <date>
**Target:** <date or ongoing>

## Success Criteria
1. <criterion>

## Scope
### In Scope
- <item>
### Out of Scope
- <item>

## Phases
| Phase | Deliverable | Duration | Depends On |
|-------|-------------|----------|------------|
```

### Step 7: Declare Output

- If requirements are incomplete or contradictory → output: `needs-requirements` → invoke `ai-works:requirements-capture` first
- Otherwise → output: `kickoff-complete`

## <BRANCH-POINT id="requirements-check">

After Step 2:
- If success criteria are vague or stakeholders are unclear: output = `needs-requirements` → invoke `ai-works:requirements-capture` before proceeding
- Otherwise: output = `kickoff-complete` → proceed to Step 3

</BRANCH-POINT>
