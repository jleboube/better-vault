/**
 * A public `VITE_*` value. Vite and the desktop build replace the static
 * `import.meta.env.VITE_*` access. The Worker bundle does not: there
 * `import.meta.env` is missing, so the same name is read from the environment
 * (a Wrangler var) and otherwise the fallback is used.
 */
export function publicEnv(read: () => string | undefined, name: string, fallback = ""): string {
  try {
    const value = read();
    if (value) return value;
    // An empty Vite value stays empty: the page and this module then agree.
    return fallback;
  } catch {
    const fromProcess = typeof process !== "undefined" ? process.env[name] : undefined;
    return fromProcess || fallback;
  }
}
