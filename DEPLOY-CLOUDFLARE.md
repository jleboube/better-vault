# Deploy on Cloudflare Workers

This deploys the web app as one Cloudflare Worker: the Vite page is served as static assets, and the Hono API in `server/` runs in the same Worker. It is meant for a private, single-user site such as `https://vault.leboube.ai` behind Cloudflare Access. The Worker has no sign-in of its own. Notebooks, notes and keys stay in the browser's IndexedDB on that browser.

The hostname stays in the Cloudflare dashboard, not in `wrangler.jsonc`. After the first deploy, attach it (Workers → your Worker → Domains & Routes) and put Cloudflare Access in front of it. The config has no `routes` and no `account_id`, so a later `wrangler deploy` leaves that dashboard setup in place.

## Build and deploy

Install dependencies from the repository root, then build the page and the asset headers:

```bash
npm install
npm run build:worker
```

`build:worker` writes the Vite client to `dist/client` and adds `dist/client/_headers` (the same Content-Security-Policy as `npm start`, plus a long cache for hashed files under `/assets/`).

Deploy that build:

```bash
npm run deploy:worker
```

That runs `wrangler deploy`. Wrangler bundles `worker/index.ts` itself; you do not commit the bundle. The first deploy needs a Cloudflare login (`npx wrangler login`). API keys for model providers are typed in the app's Settings and are not Worker secrets.

To try it on your machine before deploying:

```bash
npm run build:worker
npx wrangler dev
```

Open the URL Wrangler prints. The page should load, including a client route such as `/notebook/example`. `GET /api/models` should answer with JSON (`{"error":"Not found."}`), not the HTML page. A `POST /api/models` for OpenAI without a key should fail asking for a key, and Ollama should answer that local providers are turned off.

`VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_API_KEY`, `VITE_GOOGLE_APP_ID`, `VITE_MICROSOFT_CLIENT_ID` and `VITE_BETTER_VAULT_API` are baked into the page by the Vite build. Set them in the environment before `npm run build:worker` when this deployment should sign in to Google Drive or OneDrive, or call a backend other than `https://api.better-vault.dev`. The Worker's own calls to that backend read `VITE_BETTER_VAULT_API` from the Worker environment. Add it under **Settings → Variables** when it should differ from the default. It is a URL, not a secret. Provider keys stay in the browser.

## What Wrangler publishes

| Setting                                  | Value                                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------------------- |
| Worker name                              | `better-vault`                                                                        |
| Main module                              | `worker/index.ts` (bundled at deploy)                                                 |
| Assets                                   | `dist/client`                                                                         |
| Asset routing                            | `not_found_handling: single-page-application`, so unknown paths return `index.html`   |
| Worker-first paths                       | `/api/*` only; everything else is an asset                                            |
| Assets binding                           | `ASSETS`                                                                              |
| Compatibility date                       | `2026-11-16` (Node.js built-ins are on for this date; `nodejs_compat` is set as well) |
| Var `BETTER_VAULT_ALLOW_LOCAL_PROVIDERS` | `"false"`                                                                             |
| Var `BETTER_VAULT_ALLOW_PRIVATE_URLS`    | `"false"`                                                                             |
| Observability                            | Workers Logs and traces, sampled at 100%                                              |

The Worker has no KV, R2, D1 or other storage binding. `workers.dev` stays enabled, which is Wrangler's default when the config has no route. The `*.workers.dev` hostname is public, so it skips the Access policy on your own domain. After `vault.leboube.ai` answers, remove the `workers.dev` route in the dashboard (Workers → Settings → Domains & Routes), or put the same Access application on it.

## What does not run on the Worker

The desktop app and `npm start` are unchanged. A few features exist only where the process can use the local machine:

Sign in with ChatGPT stays in the desktop app. The Worker answers that it is desktop-only. Its tokens are kept in local files, and OpenAI only offers that sign-in to apps that run on the person's computer.

OpenCode detection and the desktop Google Drive and OneDrive sign-in (the ones that store refresh tokens in the app's data folder) are desktop-only. In the web app, Google and Microsoft sign-in still happen in the browser, which works on this deployment when the `VITE_` client ids were set at build time.

Ollama and LM Studio are off (`BETTER_VAULT_ALLOW_LOCAL_PROVIDERS=false`). A public Worker must not fetch an address the visitor supplies on your network.

Fetching a source page or a calendar uses `fetch`, and refuses private, loop-local and link-local addresses (`BETTER_VAULT_ALLOW_PRIVATE_URLS=false`), including hostnames that resolve to one. Workers also cannot `fetch` a bare IP address; add a page by its hostname. `node:sqlite` and the desktop app's database are not part of this Worker. The browser keeps your notebooks.

Streaming chat and Studio use the Vercel AI SDK's web streams. The Worker returns that stream as the response body. A request with no API key fails before a stream starts, with the same error the Node server returns.
