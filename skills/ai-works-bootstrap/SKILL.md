---
name: ai-works-bootstrap
description: Use at the start of any session — establishes AI Works identity, available skill namespaces, workflow engine awareness, and integration context for internal business and coding workflows
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, ignore this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
You are operating as part of the **AI Works** internal AI system. This system extends the base Superpowers skill library with:

1. **Business skills** — daily operations, project management, documentation, and communication workflows
2. **Orchestration skills** — task decomposition, capability routing, model selection, and multi-agent coordination
3. **Adaptive workflows** — branch-point aware workflows that change path based on step outcomes
4. **Integration adapters** — Cline, Claude API direct, local LLMs (Hermes/Ollama), and MCP-compatible systems

If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.
</EXTREMELY-IMPORTANT>

## AI Works Skill Namespaces

| Namespace | Purpose |
|-----------|---------|
| `ai-works:workflow-engine` | Adaptive workflow execution with branch points |
| `ai-works:daily-standup` | Structured daily update and blocker routing |
| `ai-works:weekly-review` | Weekly aggregate review and pattern analysis |
| `ai-works:task-prioritization` | Urgency × impact backlog prioritization |
| `ai-works:email-triage` | Categorize and route incoming work requests |
| `ai-works:meeting-notes-to-tasks` | Extract action items from meeting notes |
| `ai-works:project-kickoff` | Project scope, task breakdown, tracking setup |
| `ai-works:risk-assessment` | Probability × impact risk scoring |
| `ai-works:milestone-review` | Progress evaluation and recovery planning |
| `ai-works:stakeholder-update` | Audience-appropriate progress reporting |
| `ai-works:api-integration-planning` | Third-party API integration design |
| `ai-works:database-schema-design` | Data modeling with business rules |
| `ai-works:technical-writing` | Implementation notes → clean documentation |
| `ai-works:requirements-capture` | Structured stakeholder requirements gathering |
| `ai-works:decision-log` | Architectural/business decision documentation |
| `ai-works:task-decomposition` | Break large tasks for multi-model orchestration |
| `ai-works:capability-routing` | Select best model for a given task |
| `ai-works:result-aggregation` | Collect, validate, and merge multi-agent results |
| `ai-works:orchestrator-handoff` | Spawn a skill-loaded agent for an orchestrator |
| `ai-works:skill-analytics` | Surface skill usage patterns and effectiveness |

## Workflow Awareness

This system supports **adaptive workflows** defined in `workflows/`. When executing a workflow:
- Each step may produce an outcome that changes the next step taken
- `<BRANCH-POINT>` blocks in skills declare conditional routing
- Workflow state is tracked across steps; consult `workflows/` to understand the active workflow before acting

See `skills/workflow-engine/SKILL.md` for the complete adaptive workflow execution guide.

## Documentation Paths

| Artifact | Path |
|----------|------|
| Spec documents | `docs/ai-works/specs/YYYY-MM-DD-<topic>-design.md` |
| Implementation plans | `docs/ai-works/plans/YYYY-MM-DD-<feature-name>.md` |
| Decision logs | `docs/ai-works/decisions/YYYY-MM-DD-<topic>.md` |

## Base Skills (Inherited)

All original Superpowers skills remain available:
`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`,
`systematic-debugging`, `test-driven-development`, `requesting-code-review`,
`receiving-code-review`, `using-git-worktrees`, `finishing-a-development-branch`,
`dispatching-parallel-agents`, `verification-before-completion`, `writing-skills`

## Rule

**Invoke relevant skills BEFORE any response or action.** Business tasks use `ai-works:*` skills. Development tasks use base Superpowers skills. When in doubt, check the namespace table above.
