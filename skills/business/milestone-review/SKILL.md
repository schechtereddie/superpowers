---
name: milestone-review
description: Use at a project milestone or sprint end — evaluate progress against the plan, identify slippage, assess health, and produce a recovery plan if needed
outputs:
  - on-track
  - minor-slippage
  - major-slippage
  - milestone-failed
---

# Milestone Review

## Overview

Evaluate where a project stands against its plan at a milestone or sprint boundary. Identify slippage, assess health, and produce recovery steps if needed.

**Announce at start:** "I'm using the milestone-review skill to review this milestone."

## The Process

### Step 1: Load the Milestone Plan

Read the relevant plan file from `docs/ai-works/plans/` or the project charter. Identify:
- What was committed for this milestone
- The original completion date
- Any scope changes since the last review

### Step 2: Assess Completion

For each committed deliverable, mark:
- ✅ **Complete** — done and verified
- 🔄 **In progress** — started but not done (estimate % complete)
- ⏸️ **Blocked** — started but stuck
- ❌ **Not started** — hadn't been touched
- 🔀 **Descoped** — removed or deferred by explicit decision

Calculate:
- Completion rate: complete / total
- Schedule variance: actual_done vs expected_done at this date

### Step 3: Diagnose Slippage

For each non-complete item, identify root cause:
- **Underestimation** — task was larger than expected
- **Blocker** — external dependency or technical issue
- **Scope creep** — new work added without removing old work
- **Resource constraint** — not enough time/people
- **Priority shift** — deprioritized in favor of something else

### Step 4: Assess Project Health

| Signal | Implication |
|--------|-------------|
| Completion rate ≥ 90% | On track |
| Completion rate 70–89% | Minor slippage — manageable |
| Completion rate 50–69% | Major slippage — recovery plan needed |
| Completion rate < 50% | Milestone failed — escalate and replan |

Also assess:
- **Test health**: are tests passing? Any regressions?
- **Technical debt**: is quality degrading to hit the schedule?
- **Team morale signals**: is the team shipping comfortably or under stress?

### Step 5: Produce Recovery Plan (if needed)

For completion rate < 90%:
1. List items to **complete** before next milestone (critical path)
2. List items to **defer** to next sprint/milestone (non-critical)
3. List items to **descope** entirely (cut)
4. Identify what needs to **change** to prevent the same slippage next time

### Step 6: Produce Milestone Report

Save to `docs/ai-works/projects/<slug>/milestone-<N>-review.md`:

```markdown
# Milestone <N> Review — <date>

**Completion rate:** N%
**Status:** On track | Minor slippage | Major slippage | Failed

## Delivered
- <item> ✅

## Slipped (carrying forward)
- <item> — reason: <root cause> — recovery: <action>

## Recovery Plan
1. <action>
2. <action>

## Next Milestone Adjusted Scope
[list what's in scope for next milestone after adjustments]
```

### Step 7: Declare Output

- Completion rate ≥ 90% → output: `on-track`
- Completion rate 70–89% → output: `minor-slippage`
- Completion rate 50–69% → output: `major-slippage` → produce recovery plan
- Completion rate < 50% → output: `milestone-failed` → escalate via `ai-works:stakeholder-update`

## <BRANCH-POINT id="slippage-routing">

After Step 4:
- on-track: proceed to report
- minor-slippage: document adjustments, proceed to report
- major-slippage: produce recovery plan, then report
- milestone-failed: invoke `ai-works:stakeholder-update` immediately

</BRANCH-POINT>
