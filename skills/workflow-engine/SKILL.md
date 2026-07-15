---
name: workflow-engine
description: Use when executing a workflow defined in workflows/ — reads the workflow definition, manages step state, evaluates branch conditions, and routes to the next skill based on each step's outcome
---

# Workflow Engine

## Overview

The workflow engine executes adaptive workflows defined as YAML files in `workflows/`. Unlike a static skill checklist, an adaptive workflow forks its path at **branch points** based on the actual outcome of each step.

**Announce at start:** "I'm using the workflow-engine skill to execute the `<workflow-name>` workflow."

## Core Concepts

### Workflow Definition File

Every workflow lives in `workflows/<name>.yaml` and has this structure:

```yaml
name: my-workflow
description: What this workflow does
entry: first-step-name
steps:
  first-step-name:
    skill: ai-works:some-skill          # skill to invoke
    description: What this step does
    outputs:                             # possible outcomes this step declares
      - approved
      - needs-revision
      - blocked
    transitions:
      approved: next-step-name          # go here if outcome == approved
      needs-revision: revision-step     # go here if outcome == needs-revision
      blocked: blocked-handler          # go here if outcome == blocked
      _default: next-step-name          # fallback for undeclared outcomes

  next-step-name:
    skill: ai-works:another-skill
    terminal: true                       # this step ends the workflow
```

### BRANCH-POINT Blocks in Skills

Skills that can be used in adaptive workflows declare their branch points inline:

```
<BRANCH-POINT id="scope-check">
Evaluate:
  - If the scope is "complex multi-system": output = complex
  - If the scope is "single focused task": output = simple
  - If requirements are unclear: output = needs-clarification

Record your output in the workflow state before proceeding.
On output "complex" → invoke superpowers:brainstorming decomposition mode, then transition to task-decomposition step
On output "simple" → transition directly to writing-plans step
On output "needs-clarification" → ask one clarifying question, then re-evaluate
</BRANCH-POINT>
```

### Workflow State

The engine tracks state across steps. State is a JSON object stored in context:

```json
{
  "workflow": "daily-standup-workflow",
  "current_step": "assess-blockers",
  "completed_steps": ["gather-updates"],
  "step_outcomes": {
    "gather-updates": "has-blockers"
  },
  "accumulated_context": {
    "blockers": ["Database migration failing in CI"],
    "completed_work": ["Finished auth refactor", "Updated API docs"]
  }
}
```

## The Process

### Step 1: Load and Validate Workflow

1. Read the workflow YAML from `workflows/<name>.yaml`
2. Verify all referenced skills exist in `skills/` or `skills/business/` or `skills/orchestration/`
3. Verify all transitions reference valid step names
4. Create todos for the entry step and known first-level transitions

### Step 2: Execute Entry Step

1. Invoke the entry step's skill
2. Follow that skill to completion
3. Identify the outcome (from the skill's declared `outputs`)
4. Record the outcome in workflow state

### Step 3: Evaluate Branch Point

After each step completes:

```
if step has transitions:
    outcome → look up in transitions map
    if found → next_step = transitions[outcome]
    if not found → next_step = transitions._default (if exists) OR stop and ask
else if step.terminal == true:
    workflow complete
else:
    proceed to next step in order
```

### Step 4: Continue or Complete

- If `next_step` found: announce transition, invoke the next step's skill
- If workflow complete: summarize what was accomplished and what was decided at each branch

## Branch Point Evaluation Rules

When a skill contains a `<BRANCH-POINT>` block:

1. **Complete the current work** before evaluating the branch
2. **State your evaluation explicitly**: "Based on [evidence], the outcome is [outcome]"
3. **Record in state** before transitioning
4. **Announce the transition**: "Branch outcome: [outcome]. Transitioning to [next-step]."

## When to Stop and Ask

Stop the workflow and ask your human partner when:
- A step's outcome doesn't match any declared transition and there is no `_default`
- A step produces an outcome flagged as `requires_human: true` in the workflow YAML
- You've retried a step 3+ times without reaching a terminal output
- Workflow state is inconsistent (completed step references future step's output)

## State Persistence

Between sessions, workflow state is written to `docs/ai-works/workflow-state/<workflow-name>-state.json`. On resuming a workflow, read this file first.

```bash
# Check for in-progress workflow
ls docs/ai-works/workflow-state/ 2>/dev/null
```

If state exists, confirm with your human partner whether to resume or restart.

## Workflow Execution Summary

After a workflow completes (reached a terminal step), produce a summary:

```
Workflow: <name>
Completed: <timestamp>

Steps taken:
  1. gather-updates → outcome: has-blockers
  2. assess-blockers → outcome: technical-blocker
  3. route-to-debugging → outcome: task-created

Decisions made:
  - Routed to debugging path because: database migration failing in CI
  - Created task: "Investigate CI database migration failure"

Next workflow: none (terminal)
```

## Red Flags

- Skipping state recording and jumping to the next step without documenting the outcome
- Inferring an outcome that the skill didn't explicitly declare
- Continuing past a step that produced `requires_human: true`
- Modifying workflow YAML mid-execution to change outcomes
- Treating a `_default` transition as a real outcome rather than a fallback
