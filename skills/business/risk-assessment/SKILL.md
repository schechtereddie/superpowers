---
name: risk-assessment
description: Use when risks have been identified — score each risk on probability × impact, suggest mitigations, and classify risks as accepted, mitigated, or escalated
outputs:
  - risks-assessed
  - critical-risk-found
  - risk-escalate
---

# Risk Assessment

## Overview

Systematically evaluate identified risks, score them on probability × impact, suggest mitigations, and determine which risks require escalation vs. management.

**Announce at start:** "I'm using the risk-assessment skill to evaluate these risks."

## The Process

### Step 1: Collect the Risk List

Accept risks in any format. If not provided, ask:
> "What are the main things that could go wrong with this work?"

For each risk, gather:
- Description of what could go wrong
- Affected area (technical, schedule, resources, dependencies)

### Step 2: Score Each Risk

Score on two dimensions (1–5):

**Probability** — How likely is this to happen?
| Score | Meaning |
|-------|---------|
| 5 | Almost certain (> 80%) |
| 4 | Likely (50–80%) |
| 3 | Possible (25–50%) |
| 2 | Unlikely (10–25%) |
| 1 | Rare (< 10%) |

**Impact** — How bad if it happens?
| Score | Meaning |
|-------|---------|
| 5 | Critical: project fails, significant business damage |
| 4 | Major: significant delay or quality degradation |
| 3 | Moderate: noticeable but recoverable setback |
| 2 | Minor: small inconvenience, easy to recover |
| 1 | Negligible: barely noticeable |

**Risk Score = Probability × Impact** (max 25)

### Step 3: Classify Each Risk

| Score Range | Classification | Action |
|-------------|----------------|--------|
| 20–25 | 🔴 Critical | Immediate mitigation or escalation required |
| 12–19 | 🟠 High | Mitigation plan needed; monitor closely |
| 6–11 | 🟡 Medium | Acknowledge; add to watch list |
| 1–5 | 🟢 Low | Accept; note and move on |

### Step 4: Suggest Mitigations

For each risk scoring ≥ 6, produce:
- **Prevention**: What can be done to reduce probability?
- **Contingency**: If it happens, what's the response?
- **Early warning**: What would signal this risk is materializing?

### Step 5: Produce Risk Register

Save to `docs/ai-works/risks/YYYY-MM-DD-<context>-risks.md`:

```markdown
# Risk Register — <context> — <date>

## Summary
- Critical risks: N
- High risks: N
- Mitigations required: N

## Risk Matrix

| Risk | Probability | Impact | Score | Class | Mitigation |
|------|-------------|--------|-------|-------|------------|
| Database migration fails | 3 | 5 | 15 | 🟠 High | Run migration on staging first; prepare rollback |
| Third-party API rate limit | 4 | 3 | 12 | 🟠 High | Add retry logic; cache responses |
| Key team member unavailable | 2 | 4 | 8 | 🟡 Medium | Document key decisions; cross-train |
```

### Step 6: Declare Output

- If any risk scores 20–25 (Critical): output = `critical-risk-found` → immediately present to stakeholders
- If escalation was flagged (executive decision needed, budget impact > threshold, security risk): output = `risk-escalate` → invoke `ai-works:stakeholder-update`
- Otherwise: output = `risks-assessed`

## <BRANCH-POINT id="severity-routing">

After Step 3:
- If any risk is Critical (score 20–25): output = `critical-risk-found` — stop and escalate immediately
- If any risk requires executive decision or significant budget: output = `risk-escalate` — prepare stakeholder update
- Otherwise: output = `risks-assessed` — proceed to mitigations

</BRANCH-POINT>
