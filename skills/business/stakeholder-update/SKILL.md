---
name: stakeholder-update
description: Use when an audience-appropriate progress report is needed — generates a concise update tailored to the recipient (executive, technical team, client) from the available project data
outputs:
  - update-sent
  - update-drafted
---

# Stakeholder Update

## Overview

Produce a concise, audience-appropriate progress update from project data. Different audiences need different levels of detail and framing.

**Announce at start:** "I'm using the stakeholder-update skill to prepare this update."

## Audience Types

| Audience | Focus | Tone | Length |
|----------|-------|------|--------|
| **Executive / Sponsor** | Status, risk, decisions needed, budget | High-level, confident | 5–10 bullet points |
| **Technical Team** | What's done, what's next, technical blockers | Detailed, specific | Short paragraphs |
| **Client / External** | Delivery status, what they'll see, next steps | Professional, plain language | 1 page max |
| **All-hands / Newsletter** | Progress highlight, wins, upcoming | Positive, accessible | 3–5 sentences |

## The Process

### Step 1: Identify Audience and Purpose

Ask (or infer from context):
1. Who is receiving this update?
2. What's the primary purpose? (routine update, escalation, status check, milestone announcement)
3. What action (if any) do you need from the recipient?

### Step 2: Gather Source Material

Pull from:
- Latest standup files (`docs/ai-works/standups/`)
- Latest milestone review (`docs/ai-works/projects/<slug>/`)
- Risk register if relevant
- Any specific event that triggered this update

### Step 3: Frame the Update

For each audience, apply the right framing:

**Executive framing:**
```
1. Where are we? (1 sentence status)
2. What did we deliver this period?
3. What's at risk? (only if there's real risk)
4. What decisions do I need from you? (if any)
5. What's next?
```

**Technical team framing:**
```
1. What was merged/deployed this sprint
2. What's in progress
3. Blockers (specific, with owner)
4. Next sprint plan
```

**Client framing:**
```
1. Summary of progress (what they can see or will see)
2. What we're working on now
3. What you'll receive next (and when)
4. Any questions or approvals needed
```

### Step 4: Draft the Update

Write the update in the appropriate format. Key rules:
- **No jargon for non-technical audiences** — translate technical terms
- **Lead with status** — state the headline first, not last
- **Specifics over generalities** — "Auth is 80% complete" not "good progress"
- **Own problems** — don't soften or bury bad news; state it plainly and follow with the mitigation
- **One ask per update** — if you need a decision, ask for exactly one thing

### Step 5: Review for Completeness

Before sending, verify:
- [ ] Recipient is identified correctly
- [ ] Status is stated in the first sentence
- [ ] Any risks or slippage are clearly communicated, not buried
- [ ] If action is needed, it's explicit: "I need X from you by Y"
- [ ] No internal shorthand or jargon that the recipient wouldn't understand

### Step 6: Declare Output

- If update was sent (or confirmed to send): output = `update-sent`
- If update was drafted and needs human review before sending: output = `update-drafted`

## Red Flags

- Burying bad news in the middle of a paragraph
- Writing the same update for all audiences (copy-paste without tailoring)
- Vague status ("things are going well") without specific evidence
- Forgetting to state what action (if any) is needed from the recipient
- Sending without reviewing for audience-appropriate language
