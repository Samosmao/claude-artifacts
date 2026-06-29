export interface Env {
  AI: Ai;
  ALLOWED_ORIGIN: string;
}

// Curated list of free/standard-tier text-generation models currently on
// Workers AI that support chat-style `messages` + streaming. Keep this in
// sync with frontend/src/models.js
const ALLOWED_MODELS = new Set([
  "@cf/zai-org/glm-4.7-flash",
  "@cf/openai/gpt-oss-120b",
  "@cf/openai/gpt-oss-20b",
  "@cf/meta/llama-4-scout-17b-16e-instruct",
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.1-8b-instruct",
  "@cf/mistralai/mistral-small-3.1-24b-instruct",
  "@cf/google/gemma-3-12b-it",
  "@cf/ibm-granite/granite-4.0-h-micro",
  "@cf/qwen/qwen3-30b-a3b-fp8",
  "@cf/moonshotai/kimi-k2.7-code",
]);

const DEFAULT_MODEL = "@cf/zai-org/glm-4.7-flash";
const FALLBACK_MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const SYSTEM_PROMPT = `You are an expert developer assistant. When writing or updating code, you MUST wrap the complete updated code inside an XML artifact tag like this: <artifact filename="name.extension">YOUR FULL UPDATED CODE HERE</artifact>. Provide conversational explanations outside the tag. Never split a single file's code across multiple artifact tags. Always include the full, complete, runnable file contents inside the tag — never truncate or use "...".`;

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.ALLOWED_ORIGIN || "*";
    const headers = corsHeaders(origin);

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method !== "POST" && request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405, headers });
    }

    const url = new URL(request.url);

    // Lets the frontend fetch the allowed model list at runtime instead of
    // hardcoding it twice.
    if (url.pathname === "/api/models" && request.method === "GET") {
      return new Response(
        JSON.stringify({ models: Array.from(ALLOWED_MODELS), default: DEFAULT_MODEL }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    if (request.method !== "POST" || url.pathname !== "/api/chat") {
      return new Response("Not Found", { status: 404, headers });
    }

    let body: {
      messages: { role: string; content: string }[];
      model?: string;
    };
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const requestedModel = body.model;
    const model =
      requestedModel && ALLOWED_MODELS.has(requestedModel)
        ? requestedModel
        : DEFAULT_MODEL;

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...(body.messages || []),
    ];

    const runModel = async (modelId: string) =>
      (await env.AI.run(modelId, {
        messages,
        stream: true,
        max_tokens: 4096,
      } as any)) as ReadableStream;

    try {
      const stream = await runModel(model);
      return new Response(stream, {
        headers: {
          ...headers,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Model-Used": model,
        },
      });
    } catch (err: any) {
      // If the requested model is temporarily unavailable, fall back once.
      if (model !== FALLBACK_MODEL) {
        try {
          const stream = await runModel(FALLBACK_MODEL);
          return new Response(stream, {
            headers: {
              ...headers,
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "X-Model-Used": FALLBACK_MODEL,
            },
          });
        } catch (err2: any) {
          return new Response(
            JSON.stringify({ error: err2.message || "AI request failed" }),
            {
              status: 500,
              headers: { ...headers, "Content-Type": "application/json" },
            }
          );
        }
      }
      return new Response(JSON.stringify({ error: err.message || "AI request failed" }), {
        status: 500,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
  },
};
