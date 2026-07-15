# Workflow Definition Schema

Workflows are YAML files that define an adaptive sequence of skills. The workflow engine reads these files and routes execution based on step outcomes.

## Top-Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Unique workflow identifier, matches filename |
| `description` | string | yes | One-sentence description of the workflow's purpose |
| `version` | string | yes | Semver version string (e.g. `1.0.0`) |
| `entry` | string | yes | Name of the first step to execute |
| `steps` | map | yes | Map of step-name → step definition |
| `context_schema` | map | no | JSON Schema for accumulated_context object |

## Step Definition Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `skill` | string | yes | Skill identifier, e.g. `ai-works:daily-standup` or `brainstorming` |
| `description` | string | yes | What this step does |
| `outputs` | list | yes | Declared possible outcome values this step can produce |
| `transitions` | map | no | Map of output → next step name. Missing = terminal |
| `terminal` | bool | no | Explicit terminal marker. Defaults to `true` if no transitions. |
| `requires_human` | list | no | Outcomes that require human confirmation before transitioning |
| `context_pass` | list | no | Keys from accumulated_context to pass to the invoked skill |
| `timeout_minutes` | int | no | Max minutes before this step is considered stuck |

## Transition Map

```yaml
transitions:
  outcome-a: step-name-a   # go to step-name-a when outcome is outcome-a
  outcome-b: step-name-b
  _default: some-step      # fallback when outcome not in map
```

If `_default` is absent and the outcome doesn't match any key, the engine stops and asks the human partner.

## Example

```yaml
name: example-workflow
description: Demonstrates all schema fields
version: 1.0.0
entry: first-step

steps:
  first-step:
    skill: ai-works:daily-standup
    description: Gather daily status update
    outputs:
      - no-blockers
      - has-blockers
      - has-risks
    transitions:
      no-blockers: completion
      has-blockers: blocker-triage
      has-risks: risk-review
    timeout_minutes: 30

  blocker-triage:
    skill: systematic-debugging
    description: Investigate and triage blockers
    outputs:
      - resolved
      - needs-escalation
    requires_human:
      - needs-escalation
    transitions:
      resolved: completion
      needs-escalation: escalation-step

  risk-review:
    skill: ai-works:risk-assessment
    description: Evaluate identified risks
    outputs:
      - mitigated
      - tracked
    transitions:
      _default: completion

  escalation-step:
    skill: ai-works:stakeholder-update
    description: Prepare escalation summary
    outputs:
      - sent
    terminal: true

  completion:
    skill: ai-works:weekly-review
    description: Wrap up and produce summary
    outputs:
      - complete
    terminal: true
```
