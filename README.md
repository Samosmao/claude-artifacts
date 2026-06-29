# Claude Artifacts Clone (Cloudflare Workers AI + React)

A 2-column AI chatbot: left side is a normal streaming chat, right side is an
"Artifact Panel" that automatically catches full code blocks the model writes
(wrapped in `<artifact filename="...">`) and lets you copy or download them —
including a one-click ZIP of every file generated in the conversation.

```
claude-artifacts-clone/
├── backend/     ← Cloudflare Worker (TypeScript) — calls Workers AI, streams SSE
└── frontend/    ← React + Vite app — chat UI + artifact panel
```

## 1. Backend setup (Cloudflare Worker)

```bash
cd backend
npm install
npx wrangler login          # opens browser, connects your CF account
npx wrangler dev            # local dev at http://127.0.0.1:8787
```

Deploy for free:

```bash
npx wrangler deploy
```

This prints your live Worker URL, e.g.
`https://claude-artifacts-clone-backend.<your-subdomain>.workers.dev`

Notes:
- `wrangler.toml` already includes the `[ai]` binding — no extra setup or API
  key needed, Workers AI billing/usage is tied to your Cloudflare account
  (generous free tier).
- The Worker tries `@cf/zai-org/glm-4.7-flash` first and automatically falls
  back to `@cf/meta/llama-3.3-70b-instruct-fp8-fast` if the first model isn't
  available on your account.
- CORS is wide open (`*`) by default — tighten `ALLOWED_ORIGIN` in
  `wrangler.toml` once you know your deployed frontend domain.

## 2. Frontend setup (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
# edit .env and set VITE_WORKER_URL to your deployed Worker URL
npm run dev
```

Build & deploy for free (Cloudflare Pages, Vercel, or Netlify all work):

```bash
npm run build
# then drag/upload the generated `dist/` folder, or connect the repo
```

**Cloudflare Pages (recommended, same ecosystem):**
```bash
npx wrangler pages deploy dist --project-name claude-artifacts-clone
```

## 3. Choosing a model

A dropdown in the chat header lets the user pick from a curated list of
free/standard-tier Workers AI text-generation models (`frontend/src/models.js`):
GLM-4.7 Flash, GPT-OSS 120B/20B, Llama 4 Scout, Llama 3.3 70B, Llama 3.1 8B,
Mistral Small 3.1 24B, Gemma 3 12B, Granite 4.0 H Micro, Qwen3 30B, and Kimi
K2.7 Code.

The selected model ID is sent as `model` in the POST body to `/api/chat`. The
Worker validates it against its own `ALLOWED_MODELS` allowlist
(`backend/src/index.ts`) — if it's not on the list, or the call fails, the
Worker silently falls back to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

On load, the frontend also calls `GET /api/models` to pull the live allowlist
from the Worker, so you only need to edit the list in one place
(`backend/src/index.ts`) to add/remove models — just keep
`frontend/src/models.js` roughly in sync for the friendly labels/notes.

## 4. How the artifact detection works

1. The system prompt forces the model to wrap any full code file in:
   ```
   <artifact filename="app.py">...full file contents...</artifact>
   ```
2. The frontend reads the streamed response chunk by chunk and re-runs a
   regex parser (`src/artifactParser.js`) on the accumulated text after every
   chunk.
3. Once a `<artifact>` tag is detected (even mid-stream, before it's closed),
   the raw tag is stripped out of the chat bubble and replaced with:
   *"(Created/Updated code for `filename` in the right panel)"*
   while the code itself streams live into the right-side panel.
4. Every artifact produced in the conversation is kept in a tab strip on the
   right, with **Copy Code**, **Download File**, and **Download All (.zip)**
   (via `jszip` + `file-saver`).

## 4. Pushing to GitHub

From the project root:

```bash
git init
git add .
git commit -m "Initial commit: Claude Artifacts clone"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Both `backend/` and `frontend/` have their own `node_modules`/`.env` ignored
via `.gitignore`, so the repo stays clean.
