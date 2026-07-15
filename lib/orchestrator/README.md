# AI Works — Orchestrator HTTP API

A zero-dependency HTTP API server that lets external orchestrators (LangGraph, CrewAI, Autogen, or custom brokers) interact with the AI Works skill and model system.

## Starting the Server

```bash
node lib/orchestrator/server.js
# Listening on http://127.0.0.1:3742
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3742` | Listening port |
| `HOST` | `127.0.0.1` | Bind address |
| `SKILLS_ROOT` | `../skills` | Path to skills directory |
| `WORKFLOWS_ROOT` | `../workflows` | Path to workflows directory |
| `MODEL_REGISTRY` | `../config/model-registry.yaml` | Path to model registry |

## Endpoints

### `GET /health`
Health check.
```json
{ "status": "ok", "version": "1.0.0" }
```

### `GET /skills`
List all available skills.
```json
{
  "skills": [
    { "id": "brainstorming", "name": "brainstorming", "description": "..." },
    { "id": "business/daily-standup", "name": "daily-standup", "description": "..." }
  ]
}
```

### `GET /workflows`
List all available workflow definitions.
```json
{ "workflows": ["daily-standup-workflow", "code-review-workflow", "onboarding-workflow"] }
```

### `POST /route-task`
Recommend the best model for a task.

Request:
```json
{
  "description": "Refactor the authentication module",
  "capability_tier": "high",
  "privacy_class": "internal",
  "prefer_local": true
}
```

Response:
```json
{
  "selected_model": "hermes3",
  "provider": "local",
  "endpoint": "http://localhost:11434/v1",
  "model_name": "hermes3",
  "capability_tier_used": "high",
  "fallback_model": "claude-sonnet-4-5",
  "routing_rationale": "Selected hermes3 (local, tier=high) as best match for tier=high"
}
```

### `POST /spawn-agent`
Build a complete agent spawn package with skill injection.

Request:
```json
{
  "task": "Implement the user authentication module",
  "capability_tier": "high",
  "privacy_class": "internal",
  "context": { "spec_path": "docs/ai-works/specs/2026-07-15-auth-design.md" },
  "skills": ["using-superpowers", "ai-works-bootstrap", "writing-plans", "test-driven-development"]
}
```

Response:
```json
{
  "task_id": "550e8400-e29b-41d4-a716-446655440000",
  "agent_prompt": "## System Context\n...",
  "model_tier": "high",
  "model": "hermes3",
  "endpoint": "http://localhost:11434/v1",
  "fallback_model": "claude-sonnet-4-5",
  "skills_injected": ["using-superpowers", "ai-works-bootstrap", "writing-plans", "test-driven-development"],
  "routing_rationale": "..."
}
```

### `GET /session/:id/state`
Get the current workflow state for a session.

```json
{
  "workflow": "daily-standup-workflow",
  "current_step": "assess-blockers",
  "completed_steps": ["gather-updates"],
  "step_outcomes": { "gather-updates": "has-blockers" },
  "accumulated_context": { "blockers": ["Database migration failing"] }
}
```

### `POST /session/:id/state`
Update workflow state for a session (used by the workflow engine to persist state).

## LangGraph Integration Example

```python
import requests

ORCHESTRATOR = "http://127.0.0.1:3742"

def route_and_spawn(task, tier="mid"):
    resp = requests.post(f"{ORCHESTRATOR}/spawn-agent", json={
        "task": task,
        "capability_tier": tier,
    })
    package = resp.json()
    # Use package["agent_prompt"] as system prompt, package["endpoint"] as API URL
    return package
```

## CrewAI Integration Example

```python
from crewai import Agent
import requests

def create_ai_works_agent(task, skills=None):
    package = requests.post("http://127.0.0.1:3742/spawn-agent", json={
        "task": task,
        "skills": skills or ["using-superpowers", "ai-works-bootstrap"],
    }).json()
    
    return Agent(
        role="AI Works Agent",
        goal=task,
        backstory=package["agent_prompt"],  # inject as backstory/system context
        llm_config={"model": package["model"], "base_url": package["endpoint"]},
    )
```
