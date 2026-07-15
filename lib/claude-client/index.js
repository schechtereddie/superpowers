/**
 * AI Works — Claude API SkillLoader
 *
 * Provides a SkillLoader that reads skills from the skills/ directory and
 * assembles the correct system prompt context block for direct Claude API calls.
 *
 * Supports both stateless (inject full skill on every call) and stateful
 * (maintain conversation history with skill context) modes.
 *
 * Usage:
 *   const { SkillLoader, ClaudeClient } = require('./index.js');
 *   const loader = new SkillLoader({ skillsRoot: '/path/to/skills' });
 *   const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY, loader });
 *   const reply = await client.message('Help me with my daily standup');
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Default skills root is two directories up from this file (repo root / skills)
const DEFAULT_SKILLS_ROOT = resolve(__dirname, '../../skills');

/**
 * SkillLoader reads skill SKILL.md files and assembles context blocks.
 */
export class SkillLoader {
  constructor({ skillsRoot = DEFAULT_SKILLS_ROOT, condensed = false } = {}) {
    this.skillsRoot = skillsRoot;
    this.condensed = condensed; // use SKILL.condensed.md for local LLMs if available
    this._cache = new Map();
  }

  /**
   * List all available skill names.
   * @returns {string[]} skill names (e.g. ['brainstorming', 'ai-works-bootstrap', ...])
   */
  listSkills() {
    const skills = [];
    const scanDir = (dir, prefix = '') => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          const skillFile = this.condensed
            ? join(full, 'SKILL.condensed.md')
            : join(full, 'SKILL.md');
          const fallbackFile = join(full, 'SKILL.md');
          if (existsSync(skillFile) || existsSync(fallbackFile)) {
            skills.push(prefix ? `${prefix}/${entry}` : entry);
          } else {
            // Recurse into sub-directories (e.g. skills/business/, skills/orchestration/)
            scanDir(full, prefix ? `${prefix}/${entry}` : entry);
          }
        }
      }
    };
    scanDir(this.skillsRoot);
    return skills;
  }

  /**
   * Load a single skill's content.
   * @param {string} name - skill name or path, e.g. 'brainstorming' or 'business/daily-standup'
   * @returns {string} skill markdown content, or empty string if not found
   */
  loadSkill(name) {
    if (this._cache.has(name)) return this._cache.get(name);

    const skillDir = join(this.skillsRoot, name);
    const condensedFile = join(skillDir, 'SKILL.condensed.md');
    const fullFile = join(skillDir, 'SKILL.md');

    let content = '';
    if (this.condensed && existsSync(condensedFile)) {
      content = readFileSync(condensedFile, 'utf8');
    } else if (existsSync(fullFile)) {
      content = readFileSync(fullFile, 'utf8');
    }

    this._cache.set(name, content);
    return content;
  }

  /**
   * Build the bootstrap system prompt block.
   * Includes using-superpowers + ai-works-bootstrap (if present).
   * @returns {string} full context block wrapped in EXTREMELY_IMPORTANT tags
   */
  buildBootstrapContext() {
    const usingSuperpowers = this.loadSkill('using-superpowers');
    const aiWorksBootstrap = this.loadSkill('ai-works-bootstrap');

    let context = '<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n';
    context += "**Below is the full content of your 'superpowers:using-superpowers' skill:**\n\n";
    context += usingSuperpowers;

    if (aiWorksBootstrap) {
      context += '\n\n**AI Works System — additional skill namespaces and adaptive workflows:**\n\n';
      context += aiWorksBootstrap;
    }

    context += '\n</EXTREMELY_IMPORTANT>';
    return context;
  }

  /**
   * Build context for a specific set of skills.
   * @param {string[]} skillNames - list of skill names to include
   * @returns {string} concatenated skill content blocks
   */
  buildSkillContext(skillNames) {
    return skillNames
      .map(name => {
        const content = this.loadSkill(name);
        return content ? `## Skill: ${name}\n\n${content}` : '';
      })
      .filter(Boolean)
      .join('\n\n---\n\n');
  }
}

/**
 * ConversationState manages multi-turn conversation history.
 */
export class ConversationState {
  constructor() {
    this.messages = [];
    this.workflowState = null;
  }

  addUserMessage(content) {
    this.messages.push({ role: 'user', content });
  }

  addAssistantMessage(content) {
    this.messages.push({ role: 'assistant', content });
  }

  setWorkflowState(state) {
    this.workflowState = state;
  }

  getMessages() {
    return [...this.messages];
  }

  reset() {
    this.messages = [];
    this.workflowState = null;
  }
}

/**
 * ClaudeClient wraps the Anthropic Messages API with skill injection.
 *
 * Does NOT bundle the @anthropic-ai/sdk package — pass in your own Anthropic
 * client instance or use the raw fetch-based sendRequest() method.
 */
export class ClaudeClient {
  constructor({
    apiKey,
    loader,
    model = 'claude-opus-4-5',
    maxTokens = 8192,
    stateful = false,
    anthropicClient = null,
  } = {}) {
    this.apiKey = apiKey;
    this.loader = loader || new SkillLoader();
    this.model = model;
    this.maxTokens = maxTokens;
    this.stateful = stateful;
    this.anthropicClient = anthropicClient; // optional injected @anthropic-ai/sdk Anthropic instance
    this._state = stateful ? new ConversationState() : null;
  }

  /**
   * Send a message to Claude with skills injected in the system prompt.
   * @param {string} userMessage
   * @param {Object} [options]
   * @param {string[]} [options.extraSkills] - additional skill names to inject for this call
   * @param {string} [options.systemExtra] - additional text appended to the system prompt
   * @returns {Promise<string>} assistant text response
   */
  async message(userMessage, { extraSkills = [], systemExtra = '' } = {}) {
    const systemParts = [this.loader.buildBootstrapContext()];

    if (extraSkills.length > 0) {
      systemParts.push(this.loader.buildSkillContext(extraSkills));
    }

    if (systemExtra) {
      systemParts.push(systemExtra);
    }

    const system = systemParts.join('\n\n');

    let messages;
    if (this.stateful && this._state) {
      this._state.addUserMessage(userMessage);
      messages = this._state.getMessages();
    } else {
      messages = [{ role: 'user', content: userMessage }];
    }

    const response = await this._sendRequest({ system, messages });
    const assistantText = this._extractText(response);

    if (this.stateful && this._state) {
      this._state.addAssistantMessage(assistantText);
    }

    return assistantText;
  }

  /**
   * Send a raw API request. Uses injected anthropicClient if provided,
   * otherwise falls back to fetch with the Anthropic Messages API.
   */
  async _sendRequest({ system, messages }) {
    if (this.anthropicClient) {
      return this.anthropicClient.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system,
        messages,
      });
    }

    // Raw fetch fallback
    if (!this.apiKey) {
      throw new Error('ClaudeClient requires either an apiKey or an injected anthropicClient');
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system,
        messages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic API error ${res.status}: ${err}`);
    }

    return res.json();
  }

  _extractText(response) {
    // Handle both raw API response and SDK response shapes
    if (Array.isArray(response.content)) {
      return response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('');
    }
    return String(response);
  }

  /** Reset conversation state (stateful mode only). */
  resetConversation() {
    if (this._state) this._state.reset();
  }
}
