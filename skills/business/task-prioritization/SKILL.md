---
name: task-prioritization
description: Use when given a backlog of tasks that need ordering — scores each task on urgency × impact, produces a prioritized list with rationale
outputs:
  - prioritized
  - needs-decomposition
---

# Task Prioritization

## Overview

Given a list of tasks (backlog, daily plan, sprint items), apply urgency × impact scoring to produce an ordered priority list with rationale.

**Announce at start:** "I'm using the task-prioritization skill to prioritize this task list."

## When to Use

- Planning the day's or week's work
- Triaging a backlog after a blocker clears
- Deciding which of two competing tasks to tackle first
- After standup reveals more tasks than time available

## The Process

### Step 1: Collect the Task List

If tasks aren't provided, ask your human partner to list them. Accept in any format (bullet list, numbered, prose).

For each task, capture:
- Task name/description
- Any known deadline
- Any declared dependencies
- Any stakeholder expectations (implicit or explicit)

### Step 2: Score Each Task

Score each task on two dimensions (1–5 scale):

**Urgency** — How time-sensitive is this?
| Score | Meaning |
|-------|---------|
| 5 | Must be done today; hard deadline or blocking someone |
| 4 | Should be done this week; soft deadline or dependency |
| 3 | Should be done soon; no immediate deadline |
| 2 | Can wait; nice to have this sprint |
| 1 | No deadline; do when convenient |

**Impact** — How much does this move the needle?
| Score | Meaning |
|-------|---------|
| 5 | Critical path; blocks multiple people or major deliverable |
| 4 | High value; significantly advances a key goal |
| 3 | Medium value; useful but not critical |
| 2 | Low value; minor improvement |
| 1 | Minimal value; cleanup or cosmetic |

**Priority score = Urgency × Impact** (max 25)

### Step 3: Build Priority Matrix

Produce a table:

```
| Task | Urgency | Impact | Score | Notes |
|------|---------|--------|-------|-------|
| Fix auth bug | 5 | 5 | 25 | Blocking 3 users |
| Update API docs | 3 | 4 | 12 | Needed for release |
| Refactor logging | 2 | 2 | 4 | Tech debt |
```

### Step 4: Identify Quick Wins

Flag tasks with:
- Score ≥ 12 AND estimated time ≤ 30 minutes → "Quick win — do first"
- Score ≥ 20 → "Critical — top of queue regardless of time"

### Step 5: Produce the Ordered List

Output:
```
Priority Queue:

1. [CRITICAL] Fix auth bug (score: 25) — Blocking 3 users
2. [HIGH] Update API docs (score: 12) — Needed for release
3. [MEDIUM] Add test coverage for payment flow (score: 9)
...

Quick wins to grab first:
- Update changelog (score: 8, ~10 min)
```

### Step 6: Check for Tasks That Should Be Decomposed

If any single task has a score ≥ 15 AND would take more than a day → it's too large for the queue as-is.

Declare output:
- If any tasks need breaking down → output: `needs-decomposition` → invoke `ai-works:task-decomposition` for those tasks
- Otherwise → output: `prioritized`

## <BRANCH-POINT id="decomposition-check">

After Step 4:
- If one or more tasks score ≥ 15 AND are estimated at > 1 day: output = `needs-decomposition` — flag those tasks and offer to decompose them
- Otherwise: output = `prioritized` — produce the ordered list and finish

</BRANCH-POINT>

## Key Principles

- **Be honest about urgency** — "I feel like this is urgent" and "this has a hard deadline" are different
- **Separate urgency from importance** — high urgency + low impact tasks are traps; score carefully
- **Time-box the scoring** — don't spend 30 minutes prioritizing 5 tasks; keep it under 10 minutes
- **One pass** — don't re-score unless deadline or dependency information changes
