import { describe, it, expect } from "vitest";
import { hashContent, diffLines, diffOutputs, formatDiff } from "./diff";

describe("hashContent", () => {
  it("returns a 16-char hex string", () => {
    expect(hashContent("hello")).toHaveLength(16);
  });

  it("returns same hash for same input", () => {
    expect(hashContent("abc")).toBe(hashContent("abc"));
  });

  it("returns different hashes for different input", () => {
    expect(hashContent("a")).not.toBe(hashContent("b"));
  });
});

describe("diffLines", () => {
  it("detects no changes when content is identical", () => {
    const result = diffLines("foo\nbar", "foo\nbar");
    expect(result.changed).toBe(false);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.summary).toBe("no changes");
  });

  it("detects added lines", () => {
    const result = diffLines("foo", "foo\nbar");
    expect(result.changed).toBe(true);
    expect(result.added).toContain("bar");
    expect(result.removed).toHaveLength(0);
  });

  it("detects removed lines", () => {
    const result = diffLines("foo\nbar", "foo");
    expect(result.changed).toBe(true);
    expect(result.removed).toContain("bar");
    expect(result.added).toHaveLength(0);
  });

  it("includes summary with counts", () => {
    const result = diffLines("a\nb", "a\nc");
    expect(result.summary).toMatch(/\+1 -1/);
  });
});

describe("diffOutputs", () => {
  it("treats undefined prev as all-new output", () => {
    const result = diffOutputs(undefined, "line1\nline2");
    expect(result.changed).toBe(true);
    expect(result.added).toHaveLength(2);
    expect(result.summary).toMatch(/new output/);
  });

  it("delegates to diffLines when prev is defined", () => {
    const result = diffOutputs("old", "new");
    expect(result.changed).toBe(true);
  });
});

describe("formatDiff", () => {
  it("prefixes added lines with +", () => {
    const result = diffLines("a", "a\nb");
    expect(formatDiff(result)).toContain("+ b");
  });

  it("prefixes removed lines with -", () => {
    const result = diffLines("a\nb", "a");
    expect(formatDiff(result)).toContain("- b");
  });

  it("returns empty string for no changes", () => {
    const result = diffLines("same", "same");
    expect(formatDiff(result)).toBe("");
  });
});
