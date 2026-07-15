---
name: task-decomposition
description: Use when given a large or multi-system task that needs to be split for execution across multiple agents or model tiers — produces labeled subtasks with complexity estimates, capability requirements, and dependency graph
---

# Task Decomposition

## Overview

Break a large task into subtasks that can be routed to the right agent or model. Each subtask is labeled with its complexity tier, whether it should run locally or in the cloud, and its dependencies on other subtasks.

**Announce at start:** "I'm using the task-decomposition skill to break this task into routable subtasks."

## When to Use

- Task is too large for a single agent context window
- Task spans multiple independent domains (e.g., frontend + backend + docs)
- Orchestrator needs to route work across local and cloud LLMs
- Work can be parallelized across agents

## The Process

### Step 1: Understand the Full Task

Before decomposing, ensure you have:
- The complete task description or spec
- Any known constraints (deadlines, tech stack, existing code)
- The orchestrator's available model registry (from `config/model-registry.yaml` if present)

If spec is unclear, stop and ask ONE clarifying question before proceeding.

### Step 2: Identify Natural Seams

Break the task at **natural seams** — places where work is genuinely independent:
- Different domains (UI, API, data, infra)
- Sequential phases where phase N doesn't block phase N+2
- Independent deliverables that could be reviewed separately

**Anti-pattern:** Don't decompose by file type (all HTML in one task, all CSS in another). Decompose by feature or component.

### Step 3: Label Each Subtask

For each subtask, produce:

```
Subtask: <ID> — <short name>
Description: <one sentence>
Complexity: trivial | low | medium | high | critical
Capability tier: light | mid | high | cloud-required
  (light = fast local 3B model, mid = 7B local, high = large local/frontier,
   cloud-required = tasks needing Claude/GPT-4+ quality)
Routing hint: local | cloud | either
Depends on: [list of subtask IDs, empty if none]
Parallelizable: yes | no (relative to other non-dependent subtasks)
Estimated tokens: <rough estimate>
Verification: <how to know this subtask is done correctly>
```

### Step 4: Build the Dependency Graph

List the subtasks in execution order, accounting for dependencies. Identify:
- **Critical path** — the chain of dependent subtasks that determines total duration
- **Parallel batches** — groups of subtasks that can run simultaneously

Example:
```
Batch 1 (parallel): subtask-1, subtask-2, subtask-3
Batch 2 (parallel, after batch 1): subtask-4, subtask-5
Batch 3 (sequential, after batch 2): subtask-6
```

### Step 5: Produce the Decomposition Document

Save to `docs/ai-works/plans/YYYY-MM-DD-<task-name>-decomposition.md`:

```markdown
# Task Decomposition: <Task Name>

**Goal:** <one sentence>
**Total subtasks:** N
**Critical path length:** N subtasks

## Subtasks

[Full subtask details for each]

## Execution Plan

[Batches with parallel groups and dependencies]

## Routing Summary

| Subtask | Tier | Routing |
|---------|------|---------|
| subtask-1 | light | local |
| subtask-2 | high | cloud |
...
```

## <BRANCH-POINT id="complexity-gate">

Evaluate the overall task complexity after Step 2:
- If the task has more than 20 subtasks: output = **needs-decomposition-review** — show decomposition to your human partner before proceeding to labeling
- If the task has critical subtasks requiring cloud models and no cloud access is configured: output = **missing-capability** — flag this to the orchestrator
- If the task is well-scoped and all capabilities are available: output = **ready** — proceed to Step 3

Record your output and route accordingly.

</BRANCH-POINT>

## Capability Tier Guidelines

| Tier | Examples | Best For |
|------|----------|---------|
| `light` | phi3-mini, tinyllama | Simple text formatting, renaming, config edits |
| `mid` | phi3.5, codellama-7b | Standard code generation, basic debugging |
| `high` | hermes3, llama3.1-70b | Complex reasoning, architecture decisions |
| `cloud-required` | claude-opus, gpt-4o | Creative design, nuanced requirements, novel algorithms |

## Red Flags

- Decomposing at file-type boundaries instead of feature boundaries
- Creating subtasks so small they're not worth routing (< 100 token tasks)
- Marking everything `cloud-required` — push down to local where possible
- Ignoring existing code when estimating complexity (always read first)
- Declaring subtasks parallelizable when they write to the same file
