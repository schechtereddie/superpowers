#!/usr/bin/env node
/**
 * AI Works — Generic MCP Server
 *
 * Exposes all AI Works skills as MCP (Model Context Protocol) tools.
 * Any MCP-compatible harness (Cursor, Continue.dev, VS Code with MCP, etc.)
 * can load skills as tools by pointing to this server.
 *
 * Exposed tools:
 *   ai_works_skill_list         — list all available skills
 *   ai_works_skill_load         — load and return a skill's markdown content
 *   ai_works_workflow_list      — list all workflow definitions
 *   ai_works_workflow_load      — load a workflow YAML definition
 *   ai_works_workflow_start     — return the entry skill for a named workflow
 *   ai_works_bootstrap_context  — return the full bootstrap system prompt block
 *
 * Usage:
 *   node mcp-server/index.js
 *
 * Environment variables:
 *   SKILLS_ROOT     Path to skills directory (default: ../skills)
 *   WORKFLOWS_ROOT  Path to workflows directory (default: ../workflows)
 *   PORT            Port for HTTP transport (default: 3741, 0 = stdio only)
 *   TRANSPORT       'stdio' | 'http' (default: stdio)
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SKILLS_ROOT = process.env.SKILLS_ROOT
  ? resolve(process.env.SKILLS_ROOT)
  : resolve(__dirname, '../skills');

const WORKFLOWS_ROOT = process.env.WORKFLOWS_ROOT
  ? resolve(process.env.WORKFLOWS_ROOT)
  : resolve(__dirname, '../workflows');

const TRANSPORT = process.env.TRANSPORT || 'stdio';
const PORT = parseInt(process.env.PORT || '3741', 10);

// ─── Skill helpers ────────────────────────────────────────────────────────────

function listSkills(root = SKILLS_ROOT, prefix = '') {
  const results = [];
  if (!existsSync(root)) return results;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (!statSync(full).isDirectory()) continue;
    const skillFile = join(full, 'SKILL.md');
    const name = prefix ? `${prefix}/${entry}` : entry;
    if (existsSync(skillFile)) {
      // Read frontmatter description if available
      const content = readFileSync(skillFile, 'utf8');
      const descMatch = content.match(/^description:\s*["']?(.+?)["']?\s*$/m);
      results.push({
        name,
        description: descMatch ? descMatch[1].trim() : `${name} skill`,
        path: skillFile,
      });
    } else {
      // Recurse into subdirectory (e.g. skills/business/, skills/orchestration/)
      results.push(...listSkills(full, name));
    }
  }
  return results;
}

function loadSkill(name) {
  const skillFile = join(SKILLS_ROOT, name, 'SKILL.md');
  if (!existsSync(skillFile)) return null;
  return readFileSync(skillFile, 'utf8');
}

function listWorkflows() {
  if (!existsSync(WORKFLOWS_ROOT)) return [];
  return readdirSync(WORKFLOWS_ROOT)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => f.replace(/\.(yaml|yml)$/, ''));
}

function loadWorkflow(name) {
  for (const ext of ['.yaml', '.yml']) {
    const p = join(WORKFLOWS_ROOT, `${name}${ext}`);
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  return null;
}

function buildBootstrapContext() {
  const usingSuperpowers = loadSkill('using-superpowers') || '';
  const aiWorksBootstrap = loadSkill('ai-works-bootstrap') || '';
  let ctx = '<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n';
  ctx += "**Below is the full content of your 'superpowers:using-superpowers' skill:**\n\n";
  ctx += usingSuperpowers;
  if (aiWorksBootstrap) {
    ctx += '\n\n**AI Works System — additional skill namespaces and adaptive workflows:**\n\n';
    ctx += aiWorksBootstrap;
  }
  ctx += '\n</EXTREMELY_IMPORTANT>';
  return ctx;
}

// ─── MCP tool definitions ─────────────────────────────────────────────────────

const TOOLS = {
  ai_works_skill_list: {
    description: 'List all available AI Works skills with their names and descriptions',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
    handler() {
      const skills = listSkills();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(skills.map(s => ({ name: s.name, description: s.description })), null, 2),
          },
        ],
      };
    },
  },

  ai_works_skill_load: {
    description: 'Load the full markdown content of an AI Works skill by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Skill name, e.g. "brainstorming" or "business/daily-standup"',
        },
      },
      required: ['name'],
    },
    handler({ name }) {
      const content = loadSkill(name);
      if (!content) {
        return {
          content: [{ type: 'text', text: `Skill not found: ${name}` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: content }] };
    },
  },

  ai_works_workflow_list: {
    description: 'List all available adaptive workflow definitions',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler() {
      const workflows = listWorkflows();
      return { content: [{ type: 'text', text: JSON.stringify(workflows, null, 2) }] };
    },
  },

  ai_works_workflow_load: {
    description: 'Load the YAML definition of an adaptive workflow by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name, e.g. "daily-standup-workflow"' },
      },
      required: ['name'],
    },
    handler({ name }) {
      const content = loadWorkflow(name);
      if (!content) {
        return { content: [{ type: 'text', text: `Workflow not found: ${name}` }], isError: true };
      }
      return { content: [{ type: 'text', text: content }] };
    },
  },

  ai_works_workflow_start: {
    description: 'Get the entry skill name and first step for a named adaptive workflow',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name, e.g. "daily-standup-workflow"' },
      },
      required: ['name'],
    },
    handler({ name }) {
      const content = loadWorkflow(name);
      if (!content) {
        return { content: [{ type: 'text', text: `Workflow not found: ${name}` }], isError: true };
      }
      const entryMatch = content.match(/^entry:\s*(.+)$/m);
      const entry = entryMatch ? entryMatch[1].trim() : null;

      // Extract the entry step's skill
      let entrySkill = null;
      if (entry) {
        const stepPattern = new RegExp(`${entry}:[\\s\\S]*?skill:\\s*(.+)`, 'm');
        const match = content.match(stepPattern);
        if (match) entrySkill = match[1].trim();
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ workflow: name, entry_step: entry, entry_skill: entrySkill }, null, 2),
          },
        ],
      };
    },
  },

  ai_works_bootstrap_context: {
    description: 'Return the full bootstrap system prompt block (using-superpowers + ai-works-bootstrap)',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler() {
      return { content: [{ type: 'text', text: buildBootstrapContext() }] };
    },
  },
};

// ─── MCP JSON-RPC protocol ────────────────────────────────────────────────────

function handleRequest(req) {
  const { id, method, params } = req;

  if (method === 'initialize') {
    return {
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'ai-works', version: '1.0.0' },
      },
    };
  }

  if (method === 'tools/list') {
    return {
      id,
      result: {
        tools: Object.entries(TOOLS).map(([name, def]) => ({
          name,
          description: def.description,
          inputSchema: def.inputSchema,
        })),
      },
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params;
    const tool = TOOLS[name];
    if (!tool) {
      return {
        id,
        error: { code: -32601, message: `Unknown tool: ${name}` },
      };
    }
    try {
      const result = tool.handler(args || {});
      return { id, result };
    } catch (err) {
      return {
        id,
        error: { code: -32603, message: err.message },
      };
    }
  }

  if (method === 'notifications/initialized') {
    return null; // no response needed for notifications
  }

  return {
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

// ─── Transport: stdio ─────────────────────────────────────────────────────────

function startStdio() {
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', chunk => {
    buffer += chunk;
    let newlineIdx;
    while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIdx).trim();
      buffer = buffer.slice(newlineIdx + 1);
      if (!line) continue;
      try {
        const req = JSON.parse(line);
        const resp = handleRequest(req);
        if (resp) {
          process.stdout.write(JSON.stringify(resp) + '\n');
        }
      } catch (e) {
        process.stdout.write(
          JSON.stringify({ id: null, error: { code: -32700, message: 'Parse error' } }) + '\n'
        );
      }
    }
  });
  process.stdin.on('end', () => process.exit(0));
  process.stderr.write('[ai-works MCP] running on stdio\n');
}

// ─── Transport: HTTP (SSE) ─────────────────────────────────────────────────────

function startHTTP() {
  const clients = new Map();

  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);

    // SSE endpoint — client connects to receive responses
    if (req.method === 'GET' && url.pathname === '/sse') {
      const clientId = randomUUID();
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });
      res.write(`data: ${JSON.stringify({ type: 'endpoint', uri: `/message?clientId=${clientId}` })}\n\n`);
      clients.set(clientId, res);
      req.on('close', () => clients.delete(clientId));
      return;
    }

    // POST endpoint — client sends requests
    if (req.method === 'POST' && url.pathname === '/message') {
      const clientId = url.searchParams.get('clientId');
      let body = '';
      req.on('data', d => (body += d));
      req.on('end', () => {
        try {
          const rpcReq = JSON.parse(body);
          const rpcResp = handleRequest(rpcReq);
          const sseClient = clients.get(clientId);
          if (sseClient && rpcResp) {
            sseClient.write(`data: ${JSON.stringify(rpcResp)}\n\n`);
          }
          res.writeHead(202).end();
        } catch (e) {
          res.writeHead(400).end('Bad Request');
        }
      });
      return;
    }

    // Health check
    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', tools: Object.keys(TOOLS) }));
      return;
    }

    res.writeHead(404).end('Not Found');
  });

  server.listen(PORT, () => {
    process.stderr.write(`[ai-works MCP] HTTP transport listening on port ${PORT}\n`);
    process.stderr.write(`[ai-works MCP] SSE endpoint: http://localhost:${PORT}/sse\n`);
  });
}

// ─── Entry point ──────────────────────────────────────────────────────────────

if (TRANSPORT === 'http') {
  startHTTP();
} else {
  startStdio();
}
