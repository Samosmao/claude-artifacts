// Curated free/standard-tier text-generation models on Cloudflare Workers AI
// that support chat-style streaming. Keep in sync with backend/src/index.ts.
// (The frontend also tries GET /api/models on load to pick up any changes
// the backend allowlist makes without needing a redeploy here.)

export const MODELS = [
  {
    id: "@cf/zai-org/glm-4.7-flash",
    label: "GLM-4.7 Flash",
    note: "Fast, multilingual, 131K context — default",
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
    id: "@cf/meta/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B",
    note: "Meta, lightweight & quick",
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
];

export const DEFAULT_MODEL_ID = MODELS[0].id;
