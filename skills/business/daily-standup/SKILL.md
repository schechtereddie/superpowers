---
name: daily-standup
description: Use at the start of each work day — structured daily update collecting yesterday's completions, today's plan, and blockers; routes blockers to the right follow-up skill
outputs:
  - no-blockers
  - has-technical-blocker
  - has-process-blocker
  - has-risk
---

# Daily Standup

## Overview

Run a structured daily standup to surface work status, blockers, and risks. Produces a concise update and routes to the right follow-up action.

**Announce at start:** "I'm using the daily-standup skill to run today's standup."

## The Process

### Step 1: Gather Yesterday's Completions

Ask (one at a time if in conversation; extract from notes if provided):
1. What tasks were completed yesterday?
2. Were all planned items finished, or did anything slip?
3. Any commits, PRs, reviews, or deployments shipped?

Summarize completions in 3–5 bullet points.

### Step 2: Capture Today's Plan

Ask:
1. What are the top 3 tasks planned for today?
2. Any meetings, reviews, or deadlines today?
3. Are there dependencies on others (waiting for a PR review, waiting for info)?

Summarize today's plan in order of priority.

### Step 3: Surface Blockers and Risks

Ask:
1. Is anything blocking progress on today's tasks?
2. Any technical issues (failing tests, CI down, environment problem)?
3. Any process issues (unclear requirements, waiting on approval, missing access)?
4. Anything at risk that won't be done but needs to be?

Classify any blocker:
- **Technical blocker**: bug, broken environment, failing CI → invoke `systematic-debugging`
- **Process blocker**: unclear requirements, missing approval, dependency on others → invoke `ai-works:task-prioritization` to replan
- **Risk**: something that *might* fail but hasn't yet → invoke `ai-works:risk-assessment`
- **No blockers**: proceed to daily summary

### Step 4: Produce Standup Summary

Output in this format:

```markdown
## Daily Standup — <date>

### ✅ Yesterday
- <completion 1>
- <completion 2>

### 📋 Today
1. <task 1> (priority: high)
2. <task 2>
3. <task 3>

### 🚧 Blockers
- <blocker 1> [technical | process | risk]

### 📌 Notes
- <any dependencies, context, FYIs>
```

### Step 5: Save and Declare Output

Save to `docs/ai-works/standups/YYYY-MM-DD.md`.

Declare outcome:
- No blockers → output: `no-blockers`
- Technical blockers present → output: `has-technical-blocker`
- Process blockers present → output: `has-process-blocker`
- Risks identified → output: `has-risk`

## <BRANCH-POINT id="blocker-routing">

After Step 3:
- If **technical blocker** found: output = `has-technical-blocker` → invoke `systematic-debugging`
- If **process blocker** found: output = `has-process-blocker` → invoke `ai-works:task-prioritization` to reorder today's tasks
- If **risk** identified (not yet a blocker): output = `has-risk` → invoke `ai-works:risk-assessment`
- If no blockers: output = `no-blockers` → save summary and finish

</BRANCH-POINT>

## Key Principles

- **One question at a time** if gathering interactively
- **Be concise** — standup outputs should fit on a single screen
- **Route quickly** — identify blocker type fast and hand off to the right skill
- **Don't problem-solve during standup** — the standup surfaces blockers; other skills solve them
