import { afterEach, describe, expect, it } from "vitest";
import { publicEnv } from "./public-env";

describe("publicEnv", () => {
  const name = "BETTER_VAULT_PUBLIC_ENV_TEST";

  afterEach(() => {
    delete process.env[name];
  });

  it("uses the value Vite baked in", () => {
    expect(publicEnv(() => "https://api.example.test", name, "fallback")).toBe(
      "https://api.example.test",
    );
  });

  it("uses the fallback when Vite baked in an empty value", () => {
    process.env[name] = "from-the-environment";
    expect(publicEnv(() => "", name, "fallback")).toBe("fallback");
  });

  it("reads the environment when import.meta.env is missing, as on Workers", () => {
    process.env[name] = "from-the-environment";
    expect(
      publicEnv(
        () => {
          throw new TypeError("Cannot read properties of undefined");
        },
        name,
        "fallback",
      ),
    ).toBe("from-the-environment");
  });

  it("uses the fallback when neither Vite nor the environment has a value", () => {
    expect(
      publicEnv(
        () => {
          throw new TypeError("Cannot read properties of undefined");
        },
        name,
        "fallback",
      ),
    ).toBe("fallback");
  });
});
