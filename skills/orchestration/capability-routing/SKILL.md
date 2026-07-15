---
name: capability-routing
description: Use when selecting the best model or agent for a given subtask — reads the model registry, evaluates subtask requirements against model capabilities, and recommends the optimal routing
---

# Capability Routing

## Overview

Given a subtask (from `ai-works:task-decomposition`) and a model registry (`config/model-registry.yaml`), select the best available model or agent configuration for the task.

**Announce at start:** "I'm using the capability-routing skill to select the best model for this task."

## When to Use

- After task decomposition — routing each subtask to an appropriate model
- When an orchestrator needs to decide between local vs. cloud for a given task
- When selecting fallback models if the primary is unavailable

## The Process

### Step 1: Load Model Registry

Read `config/model-registry.yaml`. If it doesn't exist, use the hardcoded defaults in the Capability Matrix section below.

### Step 2: Assess Subtask Requirements

For each subtask being routed, evaluate:

| Requirement | Assessment |
|-------------|------------|
| **Complexity tier** | From the task-decomposition label |
| **Context length needed** | Estimate tokens for the task (input + output) |
| **Reasoning depth** | Does it require multi-step logical reasoning? |
| **Code generation quality** | Must it produce production-quality code, or prototype-quality? |
| **Latency sensitivity** | Does this block human-facing workflow (needs fast)? |
| **Cost sensitivity** | Is this a high-frequency task where cost matters? |
| **Privacy** | Does the subtask contain sensitive business data that should not leave the network? |

### Step 3: Match to Model

Using the model registry, apply this priority order:

1. **Privacy constraint wins**: If data is sensitive, route to local regardless of capability tier
2. **Capability floor**: Model must meet the subtask's declared `capability_tier`
3. **Context window**: Model must handle the estimated token count
4. **Among eligible models**: prefer the lowest-cost, lowest-latency model that meets the floor
5. **Cloud if local insufficient**: fall through to cloud only when no local model qualifies

### Step 4: Produce Routing Decision

Output the routing as a structured record:

```
Subtask: <ID>
Selected model: <model name>
Provider: local | cloud
Endpoint: <URL or identifier>
Reason: <one sentence explaining why this model was chosen>
Fallback: <fallback model if primary unavailable>
```

### Step 5: Handle Unavailable Models

If no model in the registry meets the subtask requirements:
1. Check if a fallback model can handle the task at reduced quality
2. If fallback exists: use it and annotate the subtask as "downgraded — review output"
3. If no fallback: flag as `unroutable` and surface to the orchestrator for human decision

## <BRANCH-POINT id="availability-check">

After Step 1, assess registry availability:
- If model registry is missing or empty: output = **no-registry** — use default capability matrix below, warn orchestrator
- If all declared models are available: output = **registry-ok** — proceed to Step 2
- If some models are unavailable: output = **partial-registry** — note unavailable models and proceed with what's available

</BRANCH-POINT>

## Default Capability Matrix

Use when `config/model-registry.yaml` is absent:

| Task Type | Recommended Tier | Local Option | Cloud Option |
|-----------|-----------------|--------------|--------------|
| Text formatting, renaming | light | phi3-mini, tinyllama | — |
| Config edits, simple scripts | light | phi3.5, gemma2 | — |
| Standard code generation | mid | hermes3, codellama | — |
| Code review, debugging | mid-high | hermes3, llama3.1 | — |
| Architecture design | high | llama3.1-70b | claude-sonnet |
| Complex reasoning, novel problems | cloud | — | claude-opus, gpt-4o |
| Sensitive business data (any) | local | best available local | — |

## Routing Metadata

Include in every routing decision output:

```yaml
routing:
  subtask_id: <id>
  selected_model: <name>
  provider: local | cloud
  endpoint: <url>
  capability_tier_used: light | mid | high | cloud-required
  context_window_available: <tokens>
  estimated_tokens: <tokens>
  cost_tier: free | low | medium | high
  privacy_local: true | false
  fallback_model: <name or null>
  routing_rationale: <sentence>
```

## Red Flags

- Routing privacy-sensitive tasks to cloud models without explicit approval
- Ignoring context window limits (task will be truncated and silently fail)
- Always routing to cloud "to be safe" — wastes money and latency
- Routing complex architecture tasks to light local models — output will be low quality
- Not recording fallback model (leaves orchestrator stuck when primary fails)
