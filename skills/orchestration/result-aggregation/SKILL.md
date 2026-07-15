---
name: result-aggregation
description: Use when collecting results from multiple parallel sub-agents — validates each result, resolves conflicts between overlapping outputs, and assembles the final combined output
---

# Result Aggregation

## Overview

When parallel agents produce results for related subtasks, their outputs may overlap, conflict, or leave gaps. This skill collects those results, validates them, resolves conflicts, and assembles a coherent final deliverable.

**Announce at start:** "I'm using the result-aggregation skill to collect and merge parallel agent results."

## When to Use

- After `dispatching-parallel-agents` — multiple agents worked concurrently
- After `ai-works:task-decomposition` + parallel execution — batched subtasks are complete
- Whenever outputs from two or more agents need to be merged into one deliverable

## The Process

### Step 1: Collect All Results

For each sub-agent dispatch:
1. Read the agent's summary/output
2. Note which subtask(s) it addressed
3. Note whether the agent declared success, partial success, or failure

Produce a collection manifest:

```
Agent results collected:
  subtask-1: [agent-1] SUCCESS — "Implemented user auth module"
  subtask-2: [agent-2] SUCCESS — "Wrote unit tests for auth"
  subtask-3: [agent-3] PARTIAL — "Wrote API docs, left TODO in error section"
  subtask-4: [agent-4] FAILED  — "Could not connect to database in test env"
```

### Step 2: Validate Each Result

For each successful/partial result:
1. **Spec compliance**: Does the output address the subtask's verification criteria?
2. **Interface consistency**: Are types, function names, and method signatures consistent with the decomposition plan's `Interfaces` section?
3. **No regression**: Does the change break any existing tests?

Annotate each result:
- ✅ Validated
- ⚠️ Needs review (partial success, TODO remaining)
- ❌ Failed validation (spec mismatch, broken interface, regression)

### Step 3: Identify Conflicts

Compare results for:
- **File conflicts**: Two agents modified the same file
- **Interface conflicts**: Agent A defines `getUserById(id)`, Agent B calls `fetchUser(id)`
- **Logic conflicts**: Two agents implement the same feature differently
- **Data conflicts**: Two agents produce incompatible schema changes

For each conflict, record:
```
Conflict: subtask-2 and subtask-5 both modified src/auth/index.js
  subtask-2 change: added validateSession()
  subtask-5 change: replaced entire auth middleware
  Resolution approach: [see Step 4]
```

### Step 4: Resolve Conflicts

Resolution priority order:
1. **Plan wins**: If the decomposition plan specified how components should interface, use that
2. **Spec wins**: If the spec document covers this interaction, follow it
3. **Synthesize**: If both changes are valid and compatible, merge them
4. **Escalate to human**: If changes are fundamentally incompatible, stop and ask

For each resolved conflict, document:
```
Resolution: subtask-2 and subtask-5 file conflict
Method: synthesized — applied subtask-2's validateSession() on top of subtask-5's middleware
Validated: yes — all auth tests pass
```

### Step 5: Address Failed Subtasks

For each failed or invalidated subtask:
1. **Retryable**: Was the failure environmental (missing dep, network, test env)? Re-dispatch to same agent
2. **Redesign needed**: Was the approach wrong? Invoke `brainstorming` for this subtask only
3. **Skip and document**: Is the subtask non-critical? Document the gap and proceed

### Step 6: Assemble Final Output

Once all conflicts are resolved and failures addressed:
1. Confirm all files are in their final state
2. Run the full test suite
3. Produce an aggregation summary:

```markdown
## Aggregation Summary

**Subtasks completed:** N/M
**Conflicts resolved:** N
**Tests passing:** yes/no

### What was built
[high-level description of the assembled deliverable]

### Gaps or pending items
[anything that wasn't fully resolved]
```

## <BRANCH-POINT id="conflict-severity">

After Step 3, assess conflict severity:
- If no conflicts found: output = **clean** — skip to Step 5
- If conflicts are all file-level (same file, compatible changes): output = **mergeable** — proceed to Step 4 synthesis
- If conflicts involve incompatible interface definitions: output = **interface-conflict** — escalate to human partner before merging
- If any agent produced a result that contradicts the spec: output = **spec-violation** — do NOT merge; flag to human partner

</BRANCH-POINT>

## Red Flags

- Blindly merging two agents' outputs without checking for conflicts
- Accepting an agent's "SUCCESS" claim without verifying against the subtask's verification criteria
- Resolving interface conflicts by picking one agent's definition without updating callers
- Running final tests before resolving all conflicts
- Treating partial results as full results in the aggregation summary
