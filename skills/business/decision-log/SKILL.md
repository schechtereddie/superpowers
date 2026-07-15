---
name: decision-log
description: Use when an architectural, technical, or business decision has been made — documents the context, options considered, rationale, and consequences in a structured decision record
outputs:
  - logged
---

# Decision Log

## Overview

Document a decision that was made — capturing why it was made, what alternatives were considered, and what the consequences are. Creates an immutable record that helps future contributors understand the "why" behind how things are built.

**Announce at start:** "I'm using the decision-log skill to document this decision."

## When to Use

- An architectural choice was made (language, framework, database, pattern)
- A business or product decision was made that will affect implementation
- A significant trade-off was accepted (performance vs. simplicity, build vs. buy)
- A decision was made that will surprise future readers of the code
- A direction was taken after weighing multiple valid options

## The Process

### Step 1: Identify the Decision

Answer:
1. What exactly was decided? (one clear statement)
2. When was it decided? (date)
3. Who was involved in the decision?
4. What triggered the need for this decision?

### Step 2: Capture the Context

Describe the situation that necessitated the decision:
- What problem were you trying to solve?
- What constraints were in play? (technical, business, time, team)
- What was the state of the system before this decision?

This is the most important section — future readers need to understand the constraints that existed **at the time**, not the constraints of today.

### Step 3: List the Options Considered

For each option that was genuinely considered (not just mentioned):

```
Option A: <name>
Description: <what this would have done>
Pros: <benefits>
Cons: <costs, risks, trade-offs>
Why not chosen: <reason> (or: this is the chosen option)
```

Even if there was only one real option, state it — and explain why the alternatives weren't viable.

### Step 4: State the Decision and Rationale

```
Decision: <The exact choice made>

Rationale:
- <reason 1>
- <reason 2>
- <key trade-off accepted: we chose X over Y because Z>
```

The rationale should explain why this option was better **given the constraints at the time**, not why it's objectively the best possible solution.

### Step 5: Document Consequences

What does this decision imply?

```
Consequences:
- Positive: <benefits realized>
- Negative: <trade-offs accepted or costs incurred>
- Future constraints: <things this decision constrains or prevents in the future>
- Follow-on decisions needed: <decisions this triggers>
```

### Step 6: Write the Decision Record

Save to `docs/ai-works/decisions/YYYY-MM-DD-<short-title>.md`:

```markdown
# Decision: <Title>

**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded | Deprecated
**Deciders:** <names>
**Supersedes:** <previous decision, if any>

## Context

<The situation and constraints that led to this decision>

## Decision

<The exact choice made, in one sentence>

## Options Considered

### Option A: <name> ✅ (chosen)
...

### Option B: <name>
...

## Rationale

<Why this option was chosen over the alternatives>

## Consequences

**Positive:**
- <benefit>

**Negative / Trade-offs:**
- <cost or constraint accepted>

**Follow-on decisions:**
- <what needs to be decided next>
```

### Step 7: Link the Decision

Add a reference to the decision log entry in:
- The relevant design doc (if one exists)
- The relevant code file (as a comment pointing to the decision doc, if the decision directly affects that file)
- The project's `docs/ai-works/projects/<slug>/README.md` under a "Key Decisions" section

### Step 8: Declare Output

Output: `logged` — the decision has been recorded.

## Key Principles

- **Record decisions, not options** — this is not a brainstorming document; by the time you write it, the decision is made
- **Context is king** — a decision that looks wrong today was probably right given the constraints that existed when it was made; capture those constraints
- **Immutable once accepted** — don't edit the "Decision" section after it's accepted; create a new decision record that supersedes it
- **Even bad decisions deserve a log** — if you made a decision that turned out to be wrong, log it anyway. Future you will want to know why.
