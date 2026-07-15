# AI Works — Generic MCP Server

A zero-dependency MCP (Model Context Protocol) server that exposes all AI Works skills and workflows as MCP tools. Any MCP-compatible harness — Cursor, Continue.dev, VS Code with MCP support, or any custom system — can use this server.

## Starting the Server

```bash
# stdio transport (default, for harness integration)
node mcp-server/index.js

# HTTP transport (for debugging or multi-client use)
TRANSPORT=http PORT=3741 node mcp-server/index.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILLS_ROOT` | `../skills` | Path to the skills directory |
| `WORKFLOWS_ROOT` | `../workflows` | Path to the workflows directory |
| `TRANSPORT` | `stdio` | `stdio` or `http` |
| `PORT` | `3741` | HTTP port (only when `TRANSPORT=http`) |

## Exposed Tools

| Tool | Description |
|------|-------------|
| `ai_works_skill_list` | List all available skills with names and descriptions |
| `ai_works_skill_load` | Load the full markdown content of a skill by name |
| `ai_works_workflow_list` | List all adaptive workflow definitions |
| `ai_works_workflow_load` | Load a workflow YAML definition by name |
| `ai_works_workflow_start` | Get the entry skill for a named workflow |
| `ai_works_bootstrap_context` | Return the full bootstrap system prompt block |

## Cursor Integration

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "ai-works": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"],
      "env": {
        "SKILLS_ROOT": "/absolute/path/to/skills",
        "WORKFLOWS_ROOT": "/absolute/path/to/workflows"
      }
    }
  }
}
```

## Cline (VS Code) Integration

Add to `.cline/mcp_settings.json` (or VS Code settings `cline.mcpServers`):

```json
{
  "mcpServers": {
    "ai-works": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/index.js"]
    }
  }
}
```

## Health Check (HTTP transport)

```bash
curl http://localhost:3741/health
# {"status":"ok","tools":["ai_works_skill_list","ai_works_skill_load",...]}
```
