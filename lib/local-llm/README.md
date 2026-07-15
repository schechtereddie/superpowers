# AI Works — Local LLM SkillLoader Adapter

JavaScript/ES module library for injecting AI Works skills into local LLM API calls using the OpenAI-compatible API format (Ollama, LM Studio, Hermes, etc.).

## Supported Servers

| Server | Default URL | Notes |
|--------|-------------|-------|
| Ollama | `http://localhost:11434/v1` | Use `OllamaClient` subclass |
| LM Studio | `http://localhost:1234/v1` | Use `LMStudioClient` subclass |
| Hermes (via Ollama) | `http://localhost:11434/v1` | Set `model: 'hermes3'` |
| Any OpenAI-compatible | custom | Use `LocalLLMClient` directly |

## Usage

```js
import { LocalLLMClient, OllamaClient, LMStudioClient } from './index.js';

// Ollama (Hermes)
const client = new OllamaClient({ model: 'hermes3' });
const reply = await client.message('Run a daily standup for me');

// LM Studio
const lmClient = new LMStudioClient({ model: 'hermes-3-llama-3.1-8b' });

// Generic local endpoint
const genericClient = new LocalLLMClient({
  baseUrl: 'http://my-server:8080/v1',
  model: 'my-model',
  maxTokens: 2048,
  stateful: true, // maintain conversation history
});

// List available Ollama models
const ollamaClient = new OllamaClient();
const models = await ollamaClient.listModels();

// Check model capability tier (for orchestrator routing)
console.log(client.getModelTier()); // 'high' | 'mid' | 'light' | 'unknown'
```

## Prompt Optimization

By default, `promptOptimization: true` strips the following from skill prompts before sending to local models:
- Graphviz `dot` diagram blocks (token-expensive, not rendered by local models)
- Visual Companion sections (browser-based feature not applicable to API calls)
- Excess blank lines

Set `promptOptimization: false` to send the full unmodified skill content.

## Condensed Skills

If `skills/<name>/SKILL.condensed.md` exists, the local LLM adapter uses it instead of the full `SKILL.md`. Condensed variants are 30–50% shorter and tuned for models with smaller context windows.

To create a condensed variant for a skill:
```bash
cp skills/brainstorming/SKILL.md skills/brainstorming/SKILL.condensed.md
# Edit SKILL.condensed.md to remove verbose examples, trim to core checklist
```

## API

### `new LocalLLMClient(options?)`

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `http://localhost:11434/v1` | OpenAI-compatible API base URL |
| `model` | `hermes3` | Model name |
| `apiKey` | `local` | API key (most local servers accept any string) |
| `maxTokens` | `4096` | Max response tokens |
| `temperature` | `0.7` | Sampling temperature |
| `skillsRoot` | auto-detected | Path to skills directory |
| `stateful` | `false` | Maintain conversation history |
| `promptOptimization` | `true` | Strip heavy visual sections from prompts |

**Methods:**
- `message(text, options?)` → `Promise<string>`
- `getModelTier()` → `'high' | 'mid' | 'light' | 'unknown'`
- `resetConversation()` — clear history (stateful mode only)

### `new OllamaClient(options?)` — extends LocalLLMClient
- Pre-configured for `http://localhost:11434/v1`
- Extra method: `listModels()` → `Promise<string[]>`

### `new LMStudioClient(options?)` — extends LocalLLMClient
- Pre-configured for `http://localhost:1234/v1`
