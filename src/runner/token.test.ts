import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  createTokenStore,
  issueToken,
  revokeToken,
  validateToken,
  pruneExpiredTokens,
  formatTokenLine,
} from "./token";

describe("createTokenStore", () => {
  it("creates an empty store", () => {
    const store = createTokenStore();
    expect(store.tokens.size).toBe(0);
  });
});

describe("issueToken", () => {
  it("adds a token to the store", () => {
    const store = createTokenStore();
    const token = issueToken(store);
    expect(store.tokens.has(token.id)).toBe(true);
  });

  it("stores meta on the token", () => {
    const store = createTokenStore();
    const token = issueToken(store, { task: "build" });
    expect(token.meta.task).toBe("build");
  });

  it("sets expiresAt when ttlMs is provided", () => {
    const store = createTokenStore();
    const before = Date.now();
    const token = issueToken(store, {}, 5000);
    expect(token.expiresAt).toBeGreaterThanOrEqual(before + 5000);
  });

  it("sets expiresAt to null when no ttl", () => {
    const store = createTokenStore();
    const token = issueToken(store);
    expect(token.expiresAt).toBeNull();
  });
});

describe("revokeToken", () => {
  it("removes the token from the store", () => {
    const store = createTokenStore();
    const token = issueToken(store);
    const result = revokeToken(store, token.id);
    expect(result).toBe(true);
    expect(store.tokens.has(token.id)).toBe(false);
  });

  it("returns false for unknown id", () => {
    const store = createTokenStore();
    expect(revokeToken(store, "nonexistent")).toBe(false);
  });
});

describe("validateToken", () => {
  it("returns token when valid", () => {
    const store = createTokenStore();
    const token = issueToken(store);
    expect(validateToken(store, token.id)).toEqual(token);
  });

  it("returns null for unknown id", () => {
    const store = createTokenStore();
    expect(validateToken(store, "bad-id")).toBeNull();
  });

  it("returns null and removes expired token", () => {
    vi.useFakeTimers();
    const store = createTokenStore();
    const token = issueToken(store, {}, 1000);
    vi.advanceTimersByTime(2000);
    expect(validateToken(store, token.id)).toBeNull();
    expect(store.tokens.has(token.id)).toBe(false);
    vi.useRealTimers();
  });
});

describe("pruneExpiredTokens", () => {
  it("removes expired tokens and returns count", () => {
    vi.useFakeTimers();
    const store = createTokenStore();
    issueToken(store, {}, 500);
    issueToken(store, {}, 500);
    issueToken(store);
    vi.advanceTimersByTime(1000);
    const pruned = pruneExpiredTokens(store);
    expect(pruned).toBe(2);
    expect(store.tokens.size).toBe(1);
    vi.useRealTimers();
  });
});

describe("formatTokenLine", () => {
  it("includes token id and expiry info", () => {
    const store = createTokenStore();
    const token = issueToken(store, {}, 60000);
    const line = formatTokenLine(token);
    expect(line).toContain(`[token:${token.id}]`);
    expect(line).toContain("expires=");
  });

  it("shows never when no expiry", () => {
    const store = createTokenStore();
    const token = issueToken(store);
    expect(formatTokenLine(token)).toContain("expires=never");
  });
});
