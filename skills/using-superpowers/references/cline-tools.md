---
name: cline-tools
description: Tool mapping for Cline (VS Code AI extension) — translates skill action vocabulary to Cline's native tools
---

# Cline Tool Mapping

Skills describe *actions*, never specific tools. This file maps each action to the Cline tool that implements it.

## Installation

1. Copy or symlink this repo into your VS Code workspace (or a shared config directory).
2. In Cline's settings, set **Custom System Prompt** to the output of:

   ```bash
   bash .cline/inject-bootstrap.sh
   ```

   Or configure it manually by concatenating the contents of:
   - `skills/using-superpowers/SKILL.md`
   - `skills/ai-works-bootstrap/SKILL.md`

   Wrap both in `<EXTREMELY_IMPORTANT>` tags as the session-start hook does.

3. If using MCP with Cline, point the MCP server at `mcp-server/index.js` (see `mcp-server/README.md`).

## Action → Tool Mapping

| Skill Action | Cline Tool |
|-------------|------------|
| "Read a file" | `read_file` |
| "Create a file" / "Write to a file" | `write_to_file` |
| "Edit a file" / "Apply changes" | `replace_in_file` |
| "Run a shell command" / "Execute command" | `execute_command` |
| "Search file contents" | `search_files` |
| "Find files by name" | `list_files` |
| "Fetch a URL" | `browser_action` (navigate) |
| "Create a todo" / "Mark todo complete" | Use `write_to_file` on a `TODO.md` file in the workspace |
| "Invoke a skill" | Paste the skill's SKILL.md content into the conversation, or use the MCP `skill` tool if MCP is configured |
| "Dispatch a subagent" | Use Cline's `new_task` tool if available; otherwise open a new Cline chat with the subagent prompt |
| "Ask the user" / "Ask your human partner" | `ask_followup_question` |
| "Attempt completion" | `attempt_completion` |

## MCP Integration (Recommended)

Running `mcp-server/index.js` exposes all AI Works skills as MCP tools. In `.cline/mcp_settings.json`:

```json
{
  "mcpServers": {
    "ai-works": {
      "command": "node",
      "args": ["<path-to-repo>/mcp-server/index.js"],
      "env": {
        "SKILLS_ROOT": "<path-to-repo>/skills"
      }
    }
  }
}
```

With MCP running, you can invoke skills as native tools:
- `ai_works_skill_list` — list all available skills
- `ai_works_skill_load` — load and return a skill's content
- `ai_works_workflow_start` — start an adaptive workflow by name

## Notes

- Cline does not have a native "todos" list. For skills that use todos (tracking checklists), write them to `TODO.md` or a `.ai-works/tasks.md` file in the workspace.
- The `brainstorming` skill's visual companion is not supported in Cline (no browser-tab integration). Skip that step; continue text-only.
- Skills that reference git worktrees work normally — Cline's `execute_command` can run all git commands.
