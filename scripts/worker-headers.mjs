import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

/**
 * Writes the `_headers` file Workers Static Assets applies to the built page.
 * The policy is the same one `server/node.ts` sends, including the hash of
 * the inlined theme script. A line may be at most 2000 characters.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const client = path.join(root, "dist", "client");
const lineLimit = 2000;

const vite = await createServer({
  configFile: path.join(root, "vite.config.ts"),
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "warn",
});

try {
  const { inlineScriptHashes, securityHeaders } = await vite.ssrLoadModule("/lib/security/csp.ts");
  const index = await readFile(path.join(client, "index.html"), "utf8");
  const headers = securityHeaders(inlineScriptHashes(index));
  const lines = ["/*"];
  for (const [name, value] of Object.entries(headers)) lines.push(`  ${name}: ${value}`);
  // Hashed Vite files can be cached; HTML keeps the default revalidation.
  lines.push("/assets/*", "  Cache-Control: public, max-age=31536000, immutable", "");
  for (const line of lines) {
    if (line.length > lineLimit) {
      throw new Error(`A _headers line is ${line.length} characters; the limit is ${lineLimit}.`);
    }
  }
  await writeFile(path.join(client, "_headers"), lines.join("\n"));
} finally {
  await vite.close();
}
