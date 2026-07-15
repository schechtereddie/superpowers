---
name: weekly-review
description: Use at the end of each work week — aggregate the week's standups and work, identify patterns, generate a concise summary report, and plan the following week's priorities
outputs:
  - review-complete
  - needs-escalation
---

# Weekly Review

## Overview

Summarize the week's work, identify patterns in blockers and productivity, generate a report, and set next week's priorities.

**Announce at start:** "I'm using the weekly-review skill to run the weekly review."

## The Process

### Step 1: Collect the Week's Data

Gather from:
- Daily standup files in `docs/ai-works/standups/` (this week's dates)
- Git log: `git log --since="7 days ago" --oneline --author=$(git config user.email)`
- Any task tracker exports or notes provided

If standup files are missing for some days, note the gap.

### Step 2: Aggregate Completions

From the week's data, produce:
- **Total tasks completed** — count
- **Key deliverables** — 3–5 notable things shipped
- **Work in progress** — what's carried to next week
- **Slippage** — planned items not done; reason for each

### Step 3: Analyze Patterns

Look for recurring themes in the week's data:

| Pattern | Signal |
|---------|--------|
| Same blocker appeared 2+ days | Systemic issue; needs fix, not workaround |
| Tasks consistently took longer than expected | Estimation problem or hidden complexity |
| No blockers all week | Smooth week; note what worked |
| High context-switching (many small tasks) | May indicate process issue |
| Dependencies on others blocked work | Async or coordination problem |

Document 1–3 patterns observed.

### Step 4: Generate Weekly Report

Save to `docs/ai-works/weekly-reviews/YYYY-WNN.md` (ISO week number):

```markdown
# Weekly Review — Week <N>, <Year>

**Period:** <Monday date> – <Friday date>

## Summary
<2–3 sentences summarizing the week>

## Completions
- <deliverable 1>
- <deliverable 2>
...

## Carry-Overs
- <task> — reason: <why not done>
...

## Patterns Observed
1. <pattern 1> → suggested action: <action>
2. <pattern 2> → suggested action: <action>

## Next Week's Priorities
1. <priority 1> — rationale: <why first>
2. <priority 2>
3. <priority 3>

## Notes
<anything else worth capturing>
```

### Step 5: Set Next Week's Priorities

Based on carry-overs, patterns, and upcoming deadlines:
1. List the top 3 priorities for next week in order
2. For each: one sentence of rationale
3. Flag any deadline risks for the coming week

### Step 6: Declare Output

- If week had significant unresolved issues, escalated blockers, or missed critical deadlines → output: `needs-escalation`
- Otherwise → output: `review-complete`

## <BRANCH-POINT id="escalation-check">

After Step 3:
- If any carry-over is a missed commitment to stakeholders, or a blocker that was never resolved: output = `needs-escalation` → invoke `ai-works:stakeholder-update` to prepare a summary
- Otherwise: output = `review-complete` → proceed to Step 4

</BRANCH-POINT>

## Key Principles

- **Patterns over incidents** — one bad day is noise; recurring themes are signal
- **Honest about slippage** — don't euphemize; write down what didn't get done and why
- **Brief** — the review should take 15 minutes, not 2 hours
- **Forward-looking** — the most important output is next week's priority order
