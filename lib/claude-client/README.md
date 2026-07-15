# AI Works — Claude API SkillLoader

JavaScript/ES module library for injecting AI Works skills into direct Anthropic Claude API calls.

## Usage

```js
import { SkillLoader, ClaudeClient } from './index.js';

// Stateless (new context every call)
const loader = new SkillLoader({ skillsRoot: '/path/to/repo/skills' });
const client = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
  loader,
  model: 'claude-opus-4-5',
});

const reply = await client.message('Help me run a daily standup');
console.log(reply);

// Stateful (maintains conversation history)
const statefulClient = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY,
  loader,
  stateful: true,
});

await statefulClient.message('What are my tasks today?');
const reply2 = await statefulClient.message('The first one is blocking me — what should I do?');
statefulClient.resetConversation(); // start fresh

// With extra skills for this call
const reply3 = await client.message('Assess the risks for my project', {
  extraSkills: ['business/risk-assessment'],
});

// With your own @anthropic-ai/sdk Anthropic instance
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const sdkClient = new ClaudeClient({ loader, anthropicClient: anthropic });
```

## API

### `new SkillLoader(options?)`

| Option | Default | Description |
|--------|---------|-------------|
| `skillsRoot` | `../../skills` (relative to this file) | Absolute path to the skills directory |
| `condensed` | `false` | If true, prefer `SKILL.condensed.md` over `SKILL.md` (for local LLMs) |

**Methods:**
- `listSkills()` → `string[]` — all available skill names
- `loadSkill(name)` → `string` — load one skill's markdown content
- `buildBootstrapContext()` → `string` — full system prompt block with all bootstrap skills
- `buildSkillContext(names)` → `string` — block for a specific set of skills

### `new ClaudeClient(options?)`

| Option | Default | Description |
|--------|---------|-------------|
| `apiKey` | — | Anthropic API key (required unless `anthropicClient` provided) |
| `loader` | new SkillLoader() | SkillLoader instance |
| `model` | `claude-opus-4-5` | Model identifier |
| `maxTokens` | `8192` | Max tokens in response |
| `stateful` | `false` | If true, maintain conversation history across calls |
| `anthropicClient` | `null` | Optional `@anthropic-ai/sdk` Anthropic instance |

**Methods:**
- `message(text, options?)` → `Promise<string>` — send a message, returns assistant text
- `resetConversation()` — clear conversation history (stateful mode only)
