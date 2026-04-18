import { describe, it, expect } from "vitest";
import { resolveEnv, maskEnv, interpolateEnv } from "./env";

describe("resolveEnv", () => {
  it("merges base and overrides", () => {
    const result = resolveEnv({ PATH: "/usr/bin" }, { NODE_ENV: "test" });
    expect(result.vars["PATH"]).toBe("/usr/bin");
    expect(result.vars["NODE_ENV"]).toBe("test");
  });

  it("overrides take precedence over base", () => {
    const result = resolveEnv({ FOO: "base" }, { FOO: "override" });
    expect(result.vars["FOO"]).toBe("override");
  });

  it("marks secrets as masked", () => {
    const result = resolveEnv({}, { SECRET: "abc123" }, ["SECRET"]);
    expect(result.masked.has("SECRET")).toBe(true);
  });

  it("ignores undefined base values", () => {
    const result = resolveEnv({ UNDEF: undefined } as any);
    expect(result.vars["UNDEF"]).toBeUndefined();
  });
});

describe("maskEnv", () => {
  it("replaces secret values in output", () => {
    const env = resolveEnv({}, { TOKEN: "supersecret" }, ["TOKEN"]);
    const out = maskEnv(env, "Using token supersecret here");
    expect(out).toBe("Using token [MASKED] here");
  });

  it("leaves non-secret output unchanged", () => {
    const env = resolveEnv({}, { TOKEN: "supersecret" }, []);
    const out = maskEnv(env, "Using token supersecret here");
    expect(out).toBe("Using token supersecret here");
  });
});

describe("interpolateEnv", () => {
  it("interpolates env vars into template", () => {
    const env = resolveEnv({}, { HOST: "localhost", PORT: "3000" });
    const result = interpolateEnv("http://${HOST}:${PORT}", env);
    expect(result).toBe("http://localhost:3000");
  });

  it("replaces missing vars with empty string", () => {
    const env = resolveEnv({});
    const result = interpolateEnv("value=${MISSING}", env);
    expect(result).toBe("value=");
  });
});
