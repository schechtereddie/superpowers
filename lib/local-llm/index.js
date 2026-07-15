/**
 * AI Works — Local LLM SkillLoader Adapter
 *
 * Provides a LocalLLMClient that speaks the OpenAI-compatible API format used by
 * Hermes, Ollama, LM Studio, and other local model servers.
 *
 * Extends SkillLoader with condensed-skill support: if SKILL.condensed.md exists
 * for a skill, it uses that instead of the full SKILL.md — saving tokens on models
 * with smaller context windows.
 *
 * Usage (Ollama / Hermes):
 *   import { LocalLLMClient } from './index.js';
 *   const client = new LocalLLMClient({
 *     baseUrl: 'http://localhost:11434/v1',  // Ollama
 *     model: 'hermes3',
 *   });
 *   const reply = await client.message('Run a daily standup for me');
 *
 * Usage (LM Studio):
 *   const client = new LocalLLMClient({
 *     baseUrl: 'http://localhost:1234/v1',   // LM Studio default
 *     model: 'hermes-3-llama-3.1-8b',
 *   });
 */

import { SkillLoader } from '../claude-client/index.js';

// Known capability tiers for common local models.
// These inform the orchestrator's routing decisions (see config/model-registry.yaml).
export const LOCAL_MODEL_TIERS = {
  // High capability local models (7B+ instruct-tuned)
  high: [
    'hermes3', 'nous-hermes-2', 'hermes-3-llama-3.1-8b',
    'llama3.1', 'llama3.2', 'mistral-nemo', 'qwen2.5-coder',
  ],
  // Mid-tier local models (3B–7B)
  mid: [
    'phi3.5', 'gemma2', 'codellama', 'deepseek-coder-v2-lite',
  ],
  // Light local models (< 3B, fast but limited)
  light: [
    'phi3-mini', 'tinyllama', 'qwen2.5-0.5b',
  ],
};

/**
 * LocalLLMClient — OpenAI-compatible API client with skill injection.
 * Automatically uses condensed skill variants when available.
 */
export class LocalLLMClient {
  constructor({
    baseUrl = 'http://localhost:11434/v1',
    model = 'hermes3',
    apiKey = 'local', // many local servers accept any string
    maxTokens = 4096,
    temperature = 0.7,
    skillsRoot,
    stateful = false,
    promptOptimization = true, // strip visual-companion and diagram sections
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
    this.apiKey = apiKey;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
    this.stateful = stateful;
    this.promptOptimization = promptOptimization;

    // Use condensed skills for local models
    this.loader = new SkillLoader({ skillsRoot, condensed: true });
    this._history = stateful ? [] : null;
  }

  /**
   * Send a message to the local LLM with skills injected.
   * @param {string} userMessage
   * @param {Object} [options]
   * @param {string[]} [options.extraSkills] - additional skill names to inject
   * @returns {Promise<string>} assistant text response
   */
  async message(userMessage, { extraSkills = [] } = {}) {
    let systemPrompt = this.loader.buildBootstrapContext();

    if (extraSkills.length > 0) {
      systemPrompt += '\n\n' + this.loader.buildSkillContext(extraSkills);
    }

    if (this.promptOptimization) {
      systemPrompt = this._optimizePrompt(systemPrompt);
    }

    const messages = [];
    if (this.stateful && this._history) {
      messages.push(...this._history);
    }
    messages.push({ role: 'user', content: userMessage });

    const response = await this._sendRequest({ systemPrompt, messages });
    const assistantText = this._extractText(response);

    if (this.stateful && this._history) {
      this._history.push({ role: 'user', content: userMessage });
      this._history.push({ role: 'assistant', content: assistantText });
    }

    return assistantText;
  }

  /**
   * Optimize a prompt for local models by stripping sections that are
   * expensive in tokens but not useful for smaller models:
   * - Visual companion / diagram sections
   * - Graphviz dot diagrams (digraph blocks)
   * - Redundant whitespace
   */
  _optimizePrompt(prompt) {
    // Remove digraph/dot diagram blocks (consumed by brainstorming visual companion)
    prompt = prompt.replace(/```dot[\s\S]*?```/g, '[diagram omitted for local model]');

    // Remove Visual Companion sections (browser-based, not useful for API calls)
    prompt = prompt.replace(/## Visual Companion[\s\S]*?(?=\n## |\n---|\n<\/EXTREMELY|$)/g, '');

    // Collapse multiple blank lines
    prompt = prompt.replace(/\n{3,}/g, '\n\n');

    return prompt;
  }

  async _sendRequest({ systemPrompt, messages }) {
    const body = {
      model: this.model,
      max_tokens: this.maxTokens,
      temperature: this.temperature,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    };

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Local LLM API error ${res.status} at ${this.baseUrl}: ${err}`);
    }

    return res.json();
  }

  _extractText(response) {
    // OpenAI-compatible format
    if (response.choices && response.choices.length > 0) {
      return response.choices[0].message?.content ?? '';
    }
    return String(response);
  }

  /** Reset conversation history (stateful mode only). */
  resetConversation() {
    if (this._history) this._history = [];
  }

  /**
   * Detect the capability tier of the configured model.
   * @returns {'high'|'mid'|'light'|'unknown'}
   */
  getModelTier() {
    const modelLower = this.model.toLowerCase();
    for (const [tier, models] of Object.entries(LOCAL_MODEL_TIERS)) {
      if (models.some(m => modelLower.includes(m.toLowerCase()))) {
        return tier;
      }
    }
    return 'unknown';
  }
}

/**
 * OllamaClient — convenience subclass pre-configured for Ollama's default endpoint.
 */
export class OllamaClient extends LocalLLMClient {
  constructor(options = {}) {
    super({ baseUrl: 'http://localhost:11434/v1', ...options });
  }

  /**
   * List models available in this Ollama instance.
   * @returns {Promise<string[]>} model names
   */
  async listModels() {
    const res = await fetch('http://localhost:11434/api/tags');
    if (!res.ok) throw new Error(`Ollama list models failed: ${res.status}`);
    const data = await res.json();
    return (data.models || []).map(m => m.name);
  }
}

/**
 * LMStudioClient — convenience subclass pre-configured for LM Studio's default endpoint.
 */
export class LMStudioClient extends LocalLLMClient {
  constructor(options = {}) {
    super({ baseUrl: 'http://localhost:1234/v1', apiKey: 'lm-studio', ...options });
  }
}
