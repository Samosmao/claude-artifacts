// Local fallback list (used until /api/models responds, or if it's
// unreachable). The backend is the source of truth — see backend/src/index.ts.
//
// Workers-AI-hosted models run with no extra setup. Claude entries only work
// if the backend has ANTHROPIC_API_KEY configured (the backend hides them
// from /api/models automatically when it isn't, so this local list is just
// a dev-time placeholder).

export const MODELS = [
  {
    id: "@cf/zai-org/glm-4.7-flash",
    label: "GLM-4.7 Flash",
    note: "Fast, multilingual, 131K context — default",
  },
  {
    id: "@cf/zai-org/glm-5.2",
    label: "GLM-5.2",
    note: "Z.ai flagship agentic/coding model, up to 262K context",
  },
  {
    id: "@cf/openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    note: "OpenAI open-weight, strong reasoning",
  },
  {
    id: "@cf/openai/gpt-oss-20b",
    label: "GPT-OSS 20B",
    note: "OpenAI open-weight, lower latency",
  },
  {
    id: "@cf/meta/llama-4-scout-17b-16e-instruct",
    label: "Llama 4 Scout 17B",
    note: "Meta, natively multimodal",
  },
  {
    id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
    label: "Llama 3.3 70B (fast)",
    note: "Meta, solid general-purpose fallback",
  },
  {
    id: "@cf/mistralai/mistral-small-3.1-24b-instruct",
    label: "Mistral Small 3.1 24B",
    note: "Vision + tool calling, 128K context",
  },
  {
    id: "@cf/google/gemma-3-12b-it",
    label: "Gemma 3 12B",
    note: "Google, multilingual, 128K context",
  },
  {
    id: "@cf/ibm-granite/granite-4.0-h-micro",
    label: "Granite 4.0 H Micro",
    note: "IBM, strong at agentic/tool tasks",
  },
  {
    id: "@cf/qwen/qwen3-30b-a3b-fp8",
    label: "Qwen3 30B (A3B)",
    note: "Alibaba, MoE, strong reasoning",
  },
  {
    id: "@cf/moonshotai/kimi-k2.7-code",
    label: "Kimi K2.7 Code",
    note: "Frontier MoE, great for coding tasks",
  },
  // ---- Real Claude models (require ANTHROPIC_API_KEY on the backend) ----
  {
    id: "claude-sonnet-4-6",
    label: "Claude Sonnet 4.6",
    note: "Anthropic — requires your own API key on the backend",
  },
  {
    id: "claude-opus-4-7",
    label: "Claude Opus 4.7",
    note: "Anthropic — requires your own API key on the backend",
  },
  {
    id: "claude-opus-4-8",
    label: "Claude Opus 4.8",
    note: "Anthropic — requires your own API key on the backend",
  },
  {
    id: "claude-haiku-4-5-20251001",
    label: "Claude Haiku 4.5",
    note: "Anthropic — requires your own API key on the backend",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;
