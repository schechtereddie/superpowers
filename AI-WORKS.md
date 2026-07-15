# AI Works — Custom Business AI Skill & Plugin System

AI Works is an internal business AI skill and plugin system built on top of the [Superpowers](https://github.com/obra/superpowers) foundation. It extends the base coding-agent skill library with:

- **Business workflows** for daily operations, project management, and communication
- **Adaptive workflow engine** with branch-point routing based on step outcomes
- **Orchestration infrastructure** for routing tasks across local and cloud LLMs
- **Integration adapters** for Cline, direct Claude API, Hermes/local LLMs, and MCP systems
- **Plugin architecture** for packaging and distributing custom skill sets

## Quick Start

AI Works is installed the same way as Superpowers (see the Superpowers installation docs). Once installed, the `ai-works-bootstrap` skill is automatically injected at session start alongside the standard `using-superpowers` skill.

## Skill Namespaces

| Namespace | Skills |
|-----------|--------|
| Core (Superpowers) | `brainstorming`, `writing-plans`, `executing-plans`, `systematic-debugging`, `test-driven-development`, etc. |
| Workflow Engine | `ai-works:workflow-engine` |
| Business — Daily Ops | `ai-works:daily-standup`, `ai-works:weekly-review`, `ai-works:task-prioritization`, `ai-works:email-triage`, `ai-works:meeting-notes-to-tasks` |
| Business — Project Mgmt | `ai-works:project-kickoff`, `ai-works:risk-assessment`, `ai-works:milestone-review`, `ai-works:stakeholder-update` |
| Business — Technical | `ai-works:api-integration-planning`, `ai-works:database-schema-design` |
| Business — Docs/Comms | `ai-works:technical-writing`, `ai-works:requirements-capture`, `ai-works:decision-log` |
| Orchestration | `ai-works:task-decomposition`, `ai-works:capability-routing`, `ai-works:result-aggregation`, `ai-works:orchestrator-handoff` |
| Meta | `ai-works:skill-analytics` |

## Repository Structure

```
skills/              # Base Superpowers skills (unchanged)
skills/ai-works-bootstrap/   # AI Works identity bootstrap skill
skills/workflow-engine/      # Adaptive workflow execution skill
skills/business/             # Business operations skills
skills/orchestration/        # Multi-model orchestration skills
workflows/           # Adaptive workflow YAML definitions
lib/
  claude-client/     # SkillLoader for direct Claude API use
  local-llm/         # SkillLoader for Hermes/Ollama/local LLMs
  orchestrator/      # HTTP orchestration API server
mcp-server/          # Generic MCP server exposing skills as tools
config/
  model-registry.yaml        # Available models and routing rules
  skill-registry.json        # Skill versions and active variants
plugins/             # Plugin packages (skills + workflows + config)
docs/ai-works/       # AI Works specs, plans, and decision logs
```

## Adaptive Workflows

Workflows in `workflows/` define sequences of skills with branch conditions. Unlike static skill checklists, an adaptive workflow reads the outcome of each step and routes to a different next step accordingly.

See `skills/workflow-engine/SKILL.md` for the full guide.

## Integration Adapters

| Adapter | Location | Use Case |
|---------|----------|----------|
| Cline (VS Code) | `.cline/` | VS Code AI coding extension |
| Claude API Direct | `lib/claude-client/` | Direct API calls with skill injection |
| Local LLM (Hermes/Ollama) | `lib/local-llm/` | OpenAI-compatible local models |
| MCP Server | `mcp-server/` | Any MCP-compatible harness |

## Orchestration

The orchestration API (`lib/orchestrator/`) provides:

- `GET  /skills` — list available skills
- `POST /route-task` — recommend skill and model tier for a task
- `POST /spawn-agent` — create a skill-loaded agent session
- `GET  /session/:id/state` — query running agent workflow state

Configure available models in `config/model-registry.yaml`.

## Plugin System

A plugin is a directory under `plugins/` containing a `plugin-manifest.json`, skills, workflows, and optional config. The session-start hook loads installed plugins in priority order after base skills.

See `plugins/README.md` for the plugin development guide.
