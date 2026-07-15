---
name: email-triage
description: Use when processing an inbox or message queue — categorize each message, determine required action, assign priority, and route to the appropriate workflow or skill
outputs:
  - triaged
  - action-required
  - escalation-needed
---

# Email Triage

## Overview

Process a batch of incoming emails or messages, categorize each one, determine what action is needed, and route to the right workflow.

**Announce at start:** "I'm using the email-triage skill to process this inbox."

## The Process

### Step 1: Collect the Inbox

Accept email content in any format — pasted text, forwarded messages, or a description of what's in the inbox. Process all provided messages as a batch.

### Step 2: Categorize Each Message

For each message, assign one category:

| Category | Description | Default Action |
|----------|-------------|----------------|
| **action-required** | Explicit request that needs a response or work | Act or delegate |
| **fyi** | Information only; no action needed | Read, file, or discard |
| **approval-needed** | Waiting for you to approve/reject something | Decide and respond |
| **meeting-request** | Calendar invite or meeting scheduling | Accept/decline |
| **status-request** | Someone asking for an update on something | Provide update |
| **noise** | Newsletter, automated notification, non-actionable | Archive |
| **urgent** | Time-sensitive; needs response today | Act immediately |

### Step 3: Assign Priority

For action-required and approval-needed messages, assign:
- **P1**: Needs response within 2 hours (external deadline, unblocking others)
- **P2**: Needs response today
- **P3**: Needs response this week
- **P4**: Can wait; respond when convenient

### Step 4: Produce Triage Output

```markdown
## Inbox Triage — <date> (<N> messages)

### 🔴 P1 — Act Today (< 2 hours)
1. **[From: X, Re: Y]** — action-required — "Approve the staging deployment"
   → Action: Reply with approval or ask clarifying question

### 🟠 P2 — Act Today
2. **[From: X, Re: Y]** — status-request — "Where are we on the auth refactor?"
   → Action: Send status update (use ai-works:stakeholder-update)

### 🟡 P3 — This Week
3. **[From: X, Re: Y]** — approval-needed — "Sign off on vendor contract"
   → Action: Review contract, respond by Friday

### ℹ️ FYI / No Action
4. **[Newsletter: Dev Weekly]** — noise → Archive
5. **[CI Alert]** — fyi → Check if tests fixed

### 📋 Extracted Action Items
- [ ] Reply to X re: deployment approval (P1)
- [ ] Send auth refactor status to X (P2, use stakeholder-update skill)
- [ ] Review vendor contract (P3, due Friday)
```

### Step 5: Route Action Items

For each action item:
- **Status request** → invoke `ai-works:stakeholder-update` to prepare the update
- **Meeting notes** → invoke `ai-works:meeting-notes-to-tasks` if the email contains meeting content
- **Task creation** → add to task list; consider invoking `ai-works:task-prioritization` if backlog is large
- **Technical request** → route to appropriate coding skill

### Step 6: Declare Output

- If P1 items exist → output: `action-required`
- If any escalation-needed items found (legal, security, executive) → output: `escalation-needed`
- Otherwise → output: `triaged`

## Key Principles

- **Batch, don't react** — process all messages at once before acting on any
- **Separate triage from action** — first sort, then act
- **Be ruthless with noise** — if it's FYI, file it and move on
- **Never lose a P1** — if unsure whether something is P1, treat it as P1
