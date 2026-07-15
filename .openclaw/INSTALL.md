# Installing Superpowers for OpenClaw

## Prerequisites

- [OpenClaw](https://openclaw.dev) installed

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

OpenClaw has native skills support. Skills trigger automatically when relevant —
you do not need to load them manually.

To list available skills:

```
list skills
```

## Tool Mapping

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

## Updating

To update Superpowers to the latest version:

```bash
openclaw skills install git:obra/superpowers
```

Re-running the install command fetches the latest commit.

## Getting Help

- Report issues: https://github.com/obra/superpowers/issues
- Full documentation: https://github.com/obra/superpowers/blob/main/docs/README.openclaw.md
