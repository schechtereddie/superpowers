---
name: meeting-notes-to-tasks
description: Use when given raw meeting notes — extract all action items, assign owners and deadlines, and produce a structured task list
outputs:
  - tasks-extracted
  - no-actions-found
---

# Meeting Notes to Tasks

## Overview

Parse meeting notes or a meeting summary to extract all action items, assign owners, infer deadlines, and produce a clean structured task list.

**Announce at start:** "I'm using the meeting-notes-to-tasks skill to extract action items."

## The Process

### Step 1: Receive the Notes

Accept notes in any format — paste, attached text, or dictated summary. If notes are vague or shorthand, note that some items may be ambiguous.

### Step 2: Extract Action Items

Read through the notes and identify every place where:
- Someone committed to doing something ("I'll handle X", "we'll need to Y")
- A decision was made that requires follow-up work
- A question was raised that needs an answer
- A next step was mentioned explicitly or implied

For each action item, extract:
- **What**: the task description
- **Who**: the owner (by name if mentioned, or "TBD" if unclear)
- **When**: the deadline (explicit date, relative time like "by Friday", or "no deadline stated")
- **Context**: 1 sentence of context from the meeting

### Step 3: Classify Each Action Item

| Type | Description |
|------|-------------|
| `decision-followup` | Work that flows from a decision made in the meeting |
| `research` | "Someone look into X" |
| `deliverable` | Concrete output to produce (document, code, design) |
| `communication` | Someone needs to send a message, email, or update |
| `meeting-required` | Another meeting or 1:1 needed to resolve something |
| `approval` | Something needs to be reviewed and approved |

### Step 4: Produce Structured Task List

```markdown
## Action Items from: <meeting name> — <date>
**Attendees:** <names>

### Immediate (this week)
- [ ] **[Owner: Alice]** Review and merge the authentication PR — deliverable — due: Wednesday
  > Context: PR was approved in meeting pending security review

- [ ] **[Owner: Bob]** Send updated project timeline to stakeholders — communication — due: EOD today
  > Context: Timeline was revised in meeting to push release 1 week

### Near-term (next 2 weeks)
- [ ] **[Owner: TBD]** Research alternative payment providers — research — due: Next sprint planning
  > Context: Current provider pricing raised as concern

### No deadline
- [ ] **[Owner: Carol]** Update API documentation to reflect new endpoint naming — deliverable
  > Context: Naming convention change agreed in meeting
```

### Step 5: Flag Ambiguities

List any items where the owner or deadline was unclear:

```
⚠️ Ambiguities:
- "Someone should look at the login timeout issue" — no owner assigned. Suggest assigning to [most relevant person based on context].
- "We'll revisit the pricing decision" — no date set. Suggest following up at next meeting.
```

### Step 6: Declare Output

- If action items were found → output: `tasks-extracted`
- If the notes had no action items (purely informational meeting) → output: `no-actions-found`

Offer to add extracted tasks to the task prioritization queue:
> "Would you like me to run `ai-works:task-prioritization` on these action items?"

## Key Principles

- **Every "we should" and "I'll" is a task** — don't let informal commitments disappear
- **Be specific** — "update docs" is not a task; "update the authentication section of the API docs to reflect the new token format" is
- **TBD is fine** — it's better to flag an unowned task than to silently drop it
- **Don't interpret** — if the notes say "look into X," the task is "look into X," not "implement X"
