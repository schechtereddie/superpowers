# AI Works Plugin System

A plugin is a self-contained package that extends the AI Works skill system with additional skills, workflow definitions, tool mappings, and optional configuration.

## Plugin Structure

```
plugins/
  my-plugin/
    plugin-manifest.json      # required: plugin metadata and declarations
    skills/                   # optional: skills provided by this plugin
      my-skill/
        SKILL.md
    workflows/                # optional: workflow definitions
      my-workflow.yaml
    config/                   # optional: plugin-specific config
      settings.yaml
    references/               # optional: tool mapping reference files
      my-harness-tools.md
    README.md                 # optional but recommended
```

## Plugin Manifest

Every plugin must have a `plugin-manifest.json`. See `../config/plugin-manifest.schema.json` for the full schema.

Minimal example:
```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Your Name",
  "skills": ["skills/my-skill"],
  "workflows": ["workflows/my-workflow.yaml"]
}
```

## Plugin Loading

The session-start hook loads plugins in this priority order:
1. Base AI Works skills (in `skills/`)
2. Plugins listed in `config/skill-registry.json` (in `priority` order)
3. Within a plugin: skills listed in `plugin-manifest.json`

A plugin skill with the same `name` as a base skill **overrides** it. This allows plugins to customize or replace base skill behavior.

## Skill Override Rules

To override a base skill, include a skill with the same `name` in your plugin's frontmatter:
```yaml
---
name: brainstorming  # overrides the base brainstorming skill
description: Customized brainstorming for MyCompany's workflow
---
```

The session-start hook will inject the plugin version instead of the base version.

## Creating a Plugin

1. Create `plugins/<your-plugin-name>/`
2. Write `plugin-manifest.json` following the schema
3. Add your skills to `plugins/<your-plugin-name>/skills/`
4. Add your workflows to `plugins/<your-plugin-name>/workflows/` (if any)
5. Register the plugin in `config/skill-registry.json`

## Registering a Plugin

Add to `config/skill-registry.json`:
```json
{
  "plugins": [
    {
      "name": "my-plugin",
      "path": "plugins/my-plugin",
      "enabled": true,
      "priority": 10
    }
  ]
}
```

Higher `priority` numbers are loaded later and override earlier plugins.

## Example Plugin: Sales Workflow

```
plugins/
  sales-workflow/
    plugin-manifest.json
    skills/
      crm-update/
        SKILL.md          # skill for updating CRM from notes
      deal-review/
        SKILL.md          # skill for weekly deal review
    workflows/
      weekly-sales-review.yaml
    README.md
```

`plugin-manifest.json`:
```json
{
  "name": "sales-workflow",
  "version": "1.0.0",
  "description": "Sales team workflow skills and automations",
  "skills": [
    "skills/crm-update",
    "skills/deal-review"
  ],
  "workflows": [
    "workflows/weekly-sales-review.yaml"
  ],
  "dependencies": []
}
```
