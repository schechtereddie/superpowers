---
name: orchestrator-handoff
description: Use when an external orchestrator (LangGraph, CrewAI, custom broker) needs to spawn a skill-loaded agent session — produces the bootstrap context and task specification the new agent needs to operate with AI Works skills active
---

# Orchestrator Handoff

## Overview

When an external orchestrator wants to delegate a task to an AI Works agent, it needs:
1. The bootstrap context (which skills the agent has)
2. The task specification (what the agent should do)
3. The expected output format (what to return when done)

This skill produces that complete handoff package.

**Announce at start:** "I'm using the orchestrator-handoff skill to prepare the agent spawn package."

## When to Use

- An orchestrator (LangGraph, CrewAI, Autogen, custom) needs to spawn a new agent
- A task has been routed to an AI Works agent by the capability router
- You need to pass context from the current session to a fresh agent without passing your entire history

## The Process

### Step 1: Receive Handoff Request

The orchestrator provides:
- **Task description**: What the agent should do
- **Capability tier**: What model tier is needed (from capability-routing output)
- **Relevant context**: Any accumulated context the agent needs (but NOT the full session history)
- **Expected output format**: What the agent should return when done
- **Skill set**: Which skills should be pre-loaded (or `default` for the standard AI Works set)

### Step 2: Select Skill Set

Based on the task type, identify the skills to inject:

| Task Category | Skills to Include |
|---------------|-------------------|
| Coding task | `using-superpowers`, `ai-works-bootstrap`, `brainstorming` (if design needed), `writing-plans`, `test-driven-development` |
| Debugging | `using-superpowers`, `ai-works-bootstrap`, `systematic-debugging`, `verification-before-completion` |
| Business ops | `using-superpowers`, `ai-works-bootstrap`, + relevant business skills |
| Review | `using-superpowers`, `ai-works-bootstrap`, `requesting-code-review`, `receiving-code-review` |
| Orchestration subtask | `using-superpowers`, `ai-works-bootstrap`, `ai-works:result-aggregation` |

Always include `using-superpowers` and `ai-works-bootstrap` in every agent spawn.

### Step 3: Build the Agent Prompt

Produce a complete prompt package with three sections:

```markdown
## System Context

<EXTREMELY_IMPORTANT>
You have superpowers.

[Full content of using-superpowers/SKILL.md]

[Full content of ai-works-bootstrap/SKILL.md]

[Full content of each additional selected skill]
</EXTREMELY_IMPORTANT>

## Task

You are a specialized agent. Your ONLY job is to complete the task below.
Do not do anything outside this task scope.

**Task:** <task description>

**Context provided:**
<accumulated context from orchestrator>

**Constraints:**
- Work only in: <file paths or scope>
- Do not modify: <protected paths>
- Time limit: <if any>

## Expected Output

When complete, produce a structured response in this exact format:

```json
{
  "task_id": "<task ID from orchestrator>",
  "status": "success | partial | failed",
  "summary": "<one sentence of what was done>",
  "deliverables": ["<list of files created/modified>"],
  "issues": ["<any issues encountered>"],
  "next_step_suggestion": "<optional: what the orchestrator should do next>"
}
```
```

### Step 4: Deliver Handoff Package

Return the complete handoff package to the orchestrator:

```json
{
  "agent_prompt": "<full prompt from Step 3>",
  "model_tier": "<recommended tier from capability-routing>",
  "model": "<specific model name if available>",
  "endpoint": "<API endpoint or local URL>",
  "task_id": "<ID for tracking>",
  "timeout_minutes": <N>,
  "skills_injected": ["<list of skill names included>"]
}
```

### Step 5: Register in Session State

If a workflow is in progress, record the spawned agent in workflow state:

```json
{
  "spawned_agents": [
    {
      "task_id": "<ID>",
      "subtask": "<subtask name>",
      "model": "<model>",
      "spawned_at": "<ISO timestamp>",
      "status": "running"
    }
  ]
}
```

## Integration with Orchestration API

If using the `lib/orchestrator/` HTTP API, use:

```
POST /spawn-agent
{
  "task": "<task description>",
  "capability_tier": "mid",
  "context": { ... },
  "skills": ["brainstorming", "writing-plans"]
}
```

The API calls this skill internally and returns the agent spawn package.

## Red Flags

- Passing the entire current session history to the spawned agent (defeats context isolation)
- Omitting `using-superpowers` from the agent's skill set (skills won't auto-trigger)
- Not specifying the expected output format (agent won't know how to respond)
- Spawning agents without tracking their task IDs (can't aggregate results)
- Including sensitive credentials or secrets in the agent context
