# Superpowers for OpenClaw

Complete guide for using Superpowers with [OpenClaw](https://openclaw.dev).

## Installation

```bash
openclaw skills install git:obra/superpowers
```

Restart OpenClaw after installation. Skills are registered automatically and the
`using-superpowers` bootstrap is injected at session start.

Verify by asking: "Tell me about your superpowers"

OpenClaw manages its own skill registry. If you also use Claude Code, OpenCode, or
another harness, install Superpowers separately for each one.

## Usage

### Skills trigger automatically

The `using-superpowers` bootstrap is loaded at session start. Skills auto-trigger
when conditions are met — you do not need to invoke them manually.

### Finding Skills

List all installed skills:

```
list skills
```

### Personal Skills

Create your own skills in OpenClaw's user skills directory. Each skill needs a
`SKILL.md` file with valid YAML frontmatter:

```markdown
---
name: my-skill
description: Use when [condition] - [what it does]
---

# My Skill

[Your skill content here]
```

### Project Skills

Create project-specific skills in `.openclaw/skills/` within your project.

## Updating

Re-run the install command to fetch the latest commit:

```bash
openclaw skills install git:obra/superpowers
```

## How It Works

The package does two things:

1. **Injects bootstrap context** at session start, adding superpowers awareness
   to every conversation so skills auto-trigger at the right moments.
2. **Registers the skills directory** so OpenClaw discovers all superpowers skills
   without manual configuration.

### Tool Mapping

Skills speak in actions rather than naming any one runtime's tools. On OpenClaw
these resolve to:

- "Create a todo" / "mark complete in todo list" → `TodoWrite`
- `Subagent (general-purpose):` template → subagent dispatch tool
- "Invoke a skill" → OpenClaw's native skills system
- "Read a file" → `read` / file read tool
- "Create a file" / "edit a file" / "delete a file" → `write` / `patch` tool
- "Run a shell command" → `bash` / shell tool
- "Search file contents" / "find files by name" → `grep`, `glob`
- "Fetch a URL" → web fetch tool

## Troubleshooting

### Skills not triggering

1. Confirm the install completed without errors
2. Restart OpenClaw
3. Ask "Tell me about your superpowers" to verify the bootstrap loaded
4. List skills to confirm they are registered

### Skills not found

1. Re-run `openclaw skills install git:obra/superpowers`
2. Restart OpenClaw
3. Each skill needs a `SKILL.md` file with valid YAML frontmatter

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Main documentation: https://github.com/obra/superpowers
