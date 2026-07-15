---
name: requirements-capture
description: Use when gathering requirements from stakeholders — conducts structured requirements elicitation, distinguishes functional from non-functional requirements, and produces a formal requirements document
outputs:
  - requirements-captured
  - requirements-incomplete
  - requirements-conflict
---

# Requirements Capture

## Overview

Conduct structured requirements gathering from stakeholders, distinguishing functional from non-functional requirements, surfacing implicit assumptions, and producing a formal requirements document.

**Announce at start:** "I'm using the requirements-capture skill to gather requirements."

## The Process

### Step 1: Establish Context

Before asking requirements questions, understand:
1. What problem are we solving? (not what system are we building)
2. Who are the primary users?
3. What is the definition of success?
4. Are there existing systems this replaces or integrates with?
5. What are the known constraints? (budget, timeline, tech stack)

### Step 2: Elicit Functional Requirements

Functional requirements describe **what the system must do**.

Use these question patterns (one at a time):
- "Walk me through the main thing a user does with this system."
- "What happens when [user action]?"
- "What are the edge cases — when does the normal flow break down?"
- "Are there different types of users with different permissions?"
- "What data does the system need to store?"
- "What integrations are required?"

For each functional requirement, write it as a user story or SHALL statement:
```
REQ-F001: Users SHALL be able to log in with email/password or SSO
REQ-F002: Admins SHALL be able to invite team members by email
REQ-F003: The system SHALL send a confirmation email within 30 seconds of registration
```

### Step 3: Elicit Non-Functional Requirements

Non-functional requirements describe **how well** the system must work.

Cover each category:

| Category | Questions to Ask |
|----------|-----------------|
| **Performance** | How many concurrent users? Acceptable response time? |
| **Availability** | What's the acceptable downtime? (99%? 99.9%?) |
| **Security** | Data sensitivity? Auth requirements? Compliance (HIPAA, GDPR, SOC2)? |
| **Scalability** | Expected growth rate? Peak vs. average load? |
| **Maintainability** | Who maintains it? What's the expected team size? |
| **Usability** | Accessibility requirements? Target devices? |
| **Data retention** | How long is data kept? What's the backup policy? |

### Step 4: Identify Implicit Assumptions

Push back on assumptions:
- "You said users will log in with SSO — is that for all users or just enterprise customers?"
- "The requirement says 'fast' — what's fast in this context: < 200ms? < 1 second?"
- "When you say 'admins can manage users,' can they also delete users permanently, or only deactivate?"

List discovered assumptions explicitly:
```
ASSUMPTION-001: Free tier users are rate-limited to 100 API calls/day
ASSUMPTION-002: Data is US-based; GDPR compliance is not required initially
```

### Step 5: Check for Conflicts

Look for requirements that contradict each other:
- "All data must be encrypted at rest" + "System must respond in < 10ms" (encryption latency)
- "Any user can delete their account" + "Data must be retained for 7 years" (regulatory conflict)
- "System must be available 24/7" + "No maintenance window" (operationally conflicting)

Surface each conflict explicitly. Don't resolve — surface to stakeholders.

### Step 6: Produce Requirements Document

Save to `docs/ai-works/specs/YYYY-MM-DD-<project>-requirements.md`:

```markdown
# Requirements: <Project Name>

**Version:** 1.0
**Date:** <date>
**Stakeholders:** <names>

## Context
<Problem statement and success definition>

## Functional Requirements
| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| REQ-F001 | ... | Must Have | |

## Non-Functional Requirements
| ID | Category | Requirement | Metric |
|----|----------|-------------|--------|
| REQ-NF001 | Performance | Response time | < 200ms p99 |

## Assumptions
| ID | Assumption | Confirmed By |
|----|------------|-------------|
| ASS-001 | ... | <name> |

## Conflicts
| ID | Conflict | Resolution |
|----|----------|------------|
| CON-001 | ... | TBD |
```

### Step 7: Declare Output

- If key areas are still unclear after elicitation → output: `requirements-incomplete`
- If unresolved conflicts exist → output: `requirements-conflict` → resolve with stakeholders before proceeding
- Otherwise → output: `requirements-captured`

## <BRANCH-POINT id="completeness-check">

After Step 5:
- If conflicts found: output = `requirements-conflict` — do not proceed to implementation planning until resolved
- If any Must Have requirement is vague or missing acceptance criteria: output = `requirements-incomplete`
- Otherwise: output = `requirements-captured` — proceed to `brainstorming` or `writing-plans`

</BRANCH-POINT>
