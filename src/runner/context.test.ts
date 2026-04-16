import { describe, it, expect } from "vitest";
import {
  createContext,
  setContextValue,
  getContextValue,
  interpolate,
  mergeContext,
} from "./context";

describe("createContext", () => {
  it("creates an empty context by default", () => {
    expect(createContext()).toEqual({});
  });

  it("creates a context with initial values", () => {
    expect(createContext({ foo: "bar" })).toEqual({ foo: "bar" });
  });
});

describe("setContextValue", () => {
  it("adds a new key to the context", () => {
    const ctx = createContext();
    const updated = setContextValue(ctx, "name", "alice");
    expect(updated.name).toBe("alice");
  });

  it("does not mutate the original context", () => {
    const ctx = createContext({ x: 1 });
    setContextValue(ctx, "x", 2);
    expect(ctx.x).toBe(1);
  });
});

describe("getContextValue", () => {
  it("returns the value for an existing key", () => {
    const ctx = createContext({ count: 42 });
    expect(getContextValue(ctx, "count")).toBe(42);
  });

  it("returns undefined for a missing key", () => {
    expect(getContextValue({}, "missing")).toBeUndefined();
  });
});

describe("interpolate", () => {
  it("replaces template variables with context values", () => {
    const ctx = createContext({ name: "world" });
    expect(interpolate("Hello, {{ name }}!", ctx)).toBe("Hello, world!");
  });

  it("leaves unknown variables unchanged", () => {
    expect(interpolate("Hello, {{ unknown }}!", {})).toBe("Hello, {{ unknown }}!");
  });

  it("handles multiple variables", () => {
    const ctx = createContext({ a: "foo", b: "bar" });
    expect(interpolate("{{a}} and {{b}}", ctx)).toBe("foo and bar");
  });
});

describe("mergeContext", () => {
  it("merges two contexts with overrides taking precedence", () => {
    const base = createContext({ x: 1, y: 2 });
    const overrides = createContext({ y: 99, z: 3 });
    expect(mergeContext(base, overrides)).toEqual({ x: 1, y: 99, z: 3 });
  });
});
