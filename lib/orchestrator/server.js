#!/usr/bin/env node
/**
 * AI Works — Orchestrator HTTP API
 *
 * A lightweight HTTP server that lets external orchestrators (LangGraph, CrewAI,
 * Autogen, custom brokers) interact with the AI Works skill and model system.
 *
 * Endpoints:
 *   GET  /health              — health check
 *   GET  /skills              — list all available skills
 *   GET  /workflows           — list all available workflow definitions
 *   POST /route-task          — recommend skill + model for a task description
 *   POST /spawn-agent         — build a skill-loaded agent spawn package
 *   GET  /session/:id/state   — get workflow state for a session
 *   POST /session/:id/state   — update workflow state for a session
 *
 * Usage:
 *   node lib/orchestrator/server.js
 *
 * Environment variables:
 *   PORT                Listening port (default: 3742)
 *   HOST                Bind host (default: 127.0.0.1)
 *   SKILLS_ROOT         Path to skills directory
 *   WORKFLOWS_ROOT      Path to workflows directory
 *   MODEL_REGISTRY      Path to model-registry.yaml
 */

import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '3742', 10);
const HOST = process.env.HOST || '127.0.0.1';
const REPO_ROOT = resolve(__dirname, '../..');
const SKILLS_ROOT = process.env.SKILLS_ROOT ? resolve(process.env.SKILLS_ROOT) : join(REPO_ROOT, 'skills');
const WORKFLOWS_ROOT = process.env.WORKFLOWS_ROOT ? resolve(process.env.WORKFLOWS_ROOT) : join(REPO_ROOT, 'workflows');
const MODEL_REGISTRY_PATH = process.env.MODEL_REGISTRY ? resolve(process.env.MODEL_REGISTRY) : join(REPO_ROOT, 'config/model-registry.yaml');
const STATE_DIR = join(REPO_ROOT, 'docs/ai-works/workflow-state');

// ── Helpers ──────────────────────────────────────────────────────────────────

function listSkills(root = SKILLS_ROOT, prefix = '') {
  const results = [];
  if (!existsSync(root)) return results;
  for (const entry of readdirSync(root)) {
    const full = join(root, entry);
    if (!statSync(full).isDirectory()) continue;
    const skillFile = join(full, 'SKILL.md');
    const name = prefix ? `${prefix}/${entry}` : entry;
    if (existsSync(skillFile)) {
      const content = readFileSync(skillFile, 'utf8');
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      const descMatch = content.match(/^description:\s*["']?(.+?)["']?\s*$/m);
      results.push({
        id: name,
        name: nameMatch ? nameMatch[1].trim() : name,
        description: descMatch ? descMatch[1].trim() : '',
      });
    } else {
      results.push(...listSkills(full, name));
    }
  }
  return results;
}

function listWorkflows() {
  if (!existsSync(WORKFLOWS_ROOT)) return [];
  return readdirSync(WORKFLOWS_ROOT)
    .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
    .map(f => f.replace(/\.(yaml|yml)$/, ''));
}

function loadSkillContent(name) {
  const p = join(SKILLS_ROOT, name, 'SKILL.md');
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function loadWorkflowContent(name) {
  for (const ext of ['.yaml', '.yml']) {
    const p = join(WORKFLOWS_ROOT, `${name}${ext}`);
    if (existsSync(p)) return readFileSync(p, 'utf8');
  }
  return null;
}

function parseRegistryYaml(text) {
  // Minimal YAML parser for the model registry structure.
  // Extracts only the models array and routing_rules array.
  // A full YAML parser is not bundled to stay zero-dependency.
  const models = [];
  const lines = text.split('\n');
  let inModels = false;
  let currentModel = null;

  for (const line of lines) {
    if (line.match(/^models:/)) { inModels = true; continue; }
    if (line.match(/^routing_rules:/) || line.match(/^default_model:/)) { inModels = false; }
    if (!inModels) continue;

    const idMatch = line.match(/^\s+- id:\s*(.+)$/);
    if (idMatch) {
      if (currentModel) models.push(currentModel);
      currentModel = { id: idMatch[1].trim() };
      continue;
    }
    if (currentModel) {
      const kvMatch = line.match(/^\s+(\w+):\s*(.+)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        const v = value.trim().replace(/^["']|["']$/g, '');
        currentModel[key] = v === 'true' ? true : v === 'false' ? false : v;
      }
    }
  }
  if (currentModel) models.push(currentModel);
  return { models };
}

function loadModelRegistry() {
  if (!existsSync(MODEL_REGISTRY_PATH)) return { models: [] };
  const text = readFileSync(MODEL_REGISTRY_PATH, 'utf8');
  return parseRegistryYaml(text);
}

const TIER_ORDER = { light: 0, mid: 1, high: 2, 'cloud-required': 3 };

function routeTask({ description = '', capability_tier, privacy_class = 'public', prefer_local = false }) {
  const registry = loadModelRegistry();
  const tier = capability_tier || 'mid';
  const tierLevel = TIER_ORDER[tier] ?? 1;

  // Filter: enabled models that meet the capability floor
  let candidates = registry.models.filter(m => {
    if (!m.enabled) return false;
    const mTierLevel = TIER_ORDER[m.capability_tier] ?? 1;
    if (mTierLevel < tierLevel) return false;
    if (privacy_class === 'confidential' && m.provider !== 'local') return false;
    if (prefer_local && m.provider !== 'local') return false;
    return true;
  });

  if (candidates.length === 0) {
    // Relax prefer_local constraint
    candidates = registry.models.filter(m => {
      if (!m.enabled) return false;
      const mTierLevel = TIER_ORDER[m.capability_tier] ?? 1;
      return mTierLevel >= tierLevel && !(privacy_class === 'confidential' && m.provider !== 'local');
    });
  }

  // Sort: local preferred, then by tier (lowest that meets floor), then by cost
  candidates.sort((a, b) => {
    if (a.provider === 'local' && b.provider !== 'local') return -1;
    if (b.provider === 'local' && a.provider !== 'local') return 1;
    const aTier = TIER_ORDER[a.capability_tier] ?? 1;
    const bTier = TIER_ORDER[b.capability_tier] ?? 1;
    if (aTier !== bTier) return aTier - bTier;
    return parseFloat(a.cost_per_1k_tokens || '0') - parseFloat(b.cost_per_1k_tokens || '0');
  });

  const selected = candidates[0] || null;
  const fallback = candidates[1] || null;

  return {
    selected_model: selected ? selected.id : null,
    provider: selected ? selected.provider : null,
    endpoint: selected ? selected.endpoint : null,
    model_name: selected ? selected.model_name : null,
    capability_tier_used: selected ? selected.capability_tier : null,
    fallback_model: fallback ? fallback.id : null,
    routing_rationale: selected
      ? `Selected ${selected.id} (${selected.provider}, tier=${selected.capability_tier}) as best match for tier=${tier}`
      : 'No eligible model found — check model registry',
  };
}

function buildAgentPrompt({ task, context, skills, expected_output }) {
  const skillNames = skills && skills.length > 0
    ? skills
    : ['using-superpowers', 'ai-works-bootstrap'];

  const skillContents = skillNames
    .map(name => {
      const content = loadSkillContent(name);
      return content ? `## Skill: ${name}\n\n${content}` : '';
    })
    .filter(Boolean)
    .join('\n\n---\n\n');

  return [
    '## System Context',
    '',
    '<EXTREMELY_IMPORTANT>',
    'You have superpowers.',
    '',
    skillContents,
    '</EXTREMELY_IMPORTANT>',
    '',
    '## Task',
    '',
    'You are a specialized agent. Your ONLY job is to complete the task below.',
    'Do not do anything outside this task scope.',
    '',
    `**Task:** ${task}`,
    '',
    context ? `**Context provided:**\n${typeof context === 'string' ? context : JSON.stringify(context, null, 2)}` : '',
    '',
    '## Expected Output',
    '',
    expected_output || [
      'When complete, produce a structured JSON response:',
      '```json',
      '{',
      '  "task_id": "<task ID>",',
      '  "status": "success | partial | failed",',
      '  "summary": "<one sentence of what was done>",',
      '  "deliverables": ["<files created/modified>"],',
      '  "issues": ["<any issues encountered>"]',
      '}',
      '```',
    ].join('\n'),
  ].filter(s => s !== undefined).join('\n');
}

// ── Session state ─────────────────────────────────────────────────────────────

function getSessionState(sessionId) {
  const p = join(STATE_DIR, `${sessionId}-state.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function setSessionState(sessionId, state) {
  mkdirSync(STATE_DIR, { recursive: true });
  const p = join(STATE_DIR, `${sessionId}-state.json`);
  writeFileSync(p, JSON.stringify({ ...state, updated_at: new Date().toISOString() }, null, 2));
}

// ── Request routing ───────────────────────────────────────────────────────────

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function jsonResponse(res, statusCode, body) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body, null, 2));
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const method = req.method;
  const path = url.pathname;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  if (method === 'GET' && path === '/health') {
    return jsonResponse(res, 200, { status: 'ok', version: '1.0.0' });
  }

  if (method === 'GET' && path === '/skills') {
    return jsonResponse(res, 200, { skills: listSkills() });
  }

  if (method === 'GET' && path === '/workflows') {
    return jsonResponse(res, 200, { workflows: listWorkflows() });
  }

  if (method === 'POST' && path === '/route-task') {
    const body = await readBody(req);
    const routing = routeTask(body);
    return jsonResponse(res, 200, routing);
  }

  if (method === 'POST' && path === '/spawn-agent') {
    const body = await readBody(req);
    const { task, capability_tier, privacy_class, prefer_local, context, skills, expected_output } = body;

    if (!task) return jsonResponse(res, 400, { error: 'task is required' });

    const routing = routeTask({ description: task, capability_tier, privacy_class, prefer_local });
    const prompt = buildAgentPrompt({ task, context, skills, expected_output });
    const taskId = randomUUID();

    return jsonResponse(res, 200, {
      task_id: taskId,
      agent_prompt: prompt,
      model_tier: routing.capability_tier_used,
      model: routing.model_name,
      endpoint: routing.endpoint,
      fallback_model: routing.fallback_model,
      skills_injected: skills || ['using-superpowers', 'ai-works-bootstrap'],
      routing_rationale: routing.routing_rationale,
    });
  }

  // Session state endpoints
  const sessionMatch = path.match(/^\/session\/([^/]+)\/state$/);
  if (sessionMatch) {
    const sessionId = sessionMatch[1];

    if (method === 'GET') {
      const state = getSessionState(sessionId);
      if (!state) return jsonResponse(res, 404, { error: `Session ${sessionId} not found` });
      return jsonResponse(res, 200, state);
    }

    if (method === 'POST') {
      const body = await readBody(req);
      setSessionState(sessionId, body);
      return jsonResponse(res, 200, { ok: true, session_id: sessionId });
    }
  }

  jsonResponse(res, 404, { error: 'Not found' });
}

// ── Start server ──────────────────────────────────────────────────────────────

const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    jsonResponse(res, 500, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  process.stderr.write(`[ai-works orchestrator] listening on http://${HOST}:${PORT}\n`);
  process.stderr.write(`[ai-works orchestrator] skills: ${SKILLS_ROOT}\n`);
  process.stderr.write(`[ai-works orchestrator] registry: ${MODEL_REGISTRY_PATH}\n`);
});
