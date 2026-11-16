import { createApi } from "../server/app";

const api = createApi();

/**
 * Bindings from wrangler.jsonc (`npx wrangler types` prints the same names).
 * The generated declaration uses Workers runtime types, which disagree with
 * the page's DOM lib, so the app typecheck keeps this local shape.
 */
interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  BETTER_VAULT_ALLOW_LOCAL_PROVIDERS: "false";
  BETTER_VAULT_ALLOW_PRIVATE_URLS: "false";
}

function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (isApiPath(new URL(request.url).pathname)) return api.fetch(request, env);
    return env.ASSETS.fetch(request);
  },
};
