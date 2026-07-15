---
name: skill-analytics
description: Use to review skill usage patterns and effectiveness — reads the skill usage log, surfaces which skills are invoked most, where workflows fail, and which paths are taken at branch points
outputs:
  - analysis-complete
---

# Skill Analytics

## Overview

Analyze accumulated skill usage data to surface patterns, identify ineffective workflows, and generate improvement recommendations.

**Announce at start:** "I'm using the skill-analytics skill to analyze skill usage."

## When to Use

- Periodic review (weekly or monthly) of how the AI Works system is being used
- Before modifying a skill — understand its current usage and failure rate first
- After a workflow change — verify the change had the intended effect
- When a specific skill seems to be misbehaving or producing poor results

## Logging Format

Skills log usage to `logs/skill-usage.jsonl`. Each line is a JSON record:

```json
{
  "timestamp": "2026-07-15T09:30:00Z",
  "skill": "business/daily-standup",
  "workflow": "daily-standup-workflow",
  "step": "gather-updates",
  "outcome": "has-technical-blocker",
  "branch_taken": "debug-triage",
  "duration_seconds": 45,
  "model": "hermes3",
  "session_id": "<uuid>"
}
```

To add logging to a skill, include at the end of each step:
```bash
echo '{"timestamp":"...","skill":"<name>","outcome":"<output>"}' >> logs/skill-usage.jsonl
```

## The Process

### Step 1: Load the Log

```bash
# Count total entries
wc -l logs/skill-usage.jsonl

# Show date range
head -1 logs/skill-usage.jsonl && tail -1 logs/skill-usage.jsonl
```

If the log doesn't exist, report: "No skill usage data found at logs/skill-usage.jsonl. Logging has not been configured or no skills have been invoked yet."

### Step 2: Skill Invocation Frequency

Count invocations per skill, sorted descending:

```bash
# Most invoked skills
cat logs/skill-usage.jsonl | \
  python3 -c "import sys,json,collections; data=[json.loads(l) for l in sys.stdin]; c=collections.Counter(d['skill'] for d in data); [print(f'{v:5d}  {k}') for k,v in c.most_common()]"
```

Produce a ranked table: skill name, invocation count, % of total.

### Step 3: Outcome Distribution

For each skill, show the distribution of outcomes:

```
skill: business/daily-standup
  no-blockers:           42 (61%)
  has-technical-blocker: 15 (22%)
  has-process-blocker:    8 (12%)
  has-risk:               4 (6%)
```

Highlight unexpected distributions:
- A skill consistently producing only one outcome (may be too narrow)
- A skill producing `needs-clarification` > 30% of the time (may be poorly specified)

### Step 4: Branch Path Analysis

For workflow-aware invocations, show which branch paths are actually taken:

```
workflow: daily-standup-workflow
  gather-updates → daily-summary:    42 (61%)
  gather-updates → debug-triage:     15 (22%)
  gather-updates → task-planning:     8 (12%)
  gather-updates → risk-review:       4 (6%)
```

Flag under-used paths (taken < 2% of the time) — they may indicate the condition is too specific to be useful.

### Step 5: Duration Analysis

For each skill, compute:
- Median duration
- 90th percentile duration
- Outliers (> 3× median)

Skills with high duration outliers may be getting stuck or hitting unclear steps.

### Step 6: Model Usage

Break down invocations by model:

```
hermes3:          85 (62%)
llama3.1-8b:      30 (22%)
claude-sonnet:    22 (16%)
```

If expensive cloud models are used for tasks that local models handle, review routing rules.

### Step 7: Produce Analytics Report

Save to `docs/ai-works/analytics/YYYY-MM-DD-skill-analytics.md`:

```markdown
# Skill Analytics Report — <date>

**Period:** <start> to <end>
**Total invocations:** N

## Top Skills by Usage
[table]

## Outcome Distribution Highlights
[top 5 skills with distribution analysis]

## Branch Path Analysis
[for each workflow]

## Improvement Recommendations
1. <specific skill> — <what to change and why>
2. <specific workflow> — <routing issue observed>
```

### Step 8: Declare Output

Output: `analysis-complete`

## Using Analytics to Improve Skills

After running analytics:
- Skills with > 20% `needs-clarification` outcomes → review and tighten the skill's questions
- Workflows where one path is taken > 80% of the time → consider simplifying the workflow
- Skills with high duration variance → review for unclear steps or branch points without `_default`
- Frequently invoked skills → candidates for condensed variants (for local LLM use)
