import { publicEnv } from "@/lib/public-env";

/** The app version, from package.json (set in vite.config.ts). */
export const appVersion: string = publicEnv(
  () => import.meta.env.VITE_APP_VERSION,
  "VITE_APP_VERSION",
  "0.0.0",
);

export const repositoryUrl = "https://github.com/better-vault/better-vault";
