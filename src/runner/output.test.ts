import { describe, it, expect } from "vitest";
import {
  formatOutput,
  summarizeOutput,
  fingerprintOutput,
  TaskOutput,
} from "./output";

const baseOutput: TaskOutput = {
  taskId: "build",
  stdout: "hello world",
  stderr: "",
  exitCode: 0,
  durationMs: 123,
};

describe("formatOutput", () => {
  it("returns empty string for silent format", () => {
    const result = formatOutput(baseOutput, "silent");
    expect(result.raw).toBe("");
    expect(result.truncated).toBe(false);
  });

  it("returns raw text for text format", () => {
    const result = formatOutput(baseOutput, "text");
    expect(result.raw).toBe("hello world");
    expect(result.parsed).toBeUndefined();
  });

  it("parses valid JSON for json format", () => {
    const output = { ...baseOutput, stdout: '{"key":"value"}' };
    const result = formatOutput(output, "json");
    expect(result.parsed).toEqual({ key: "value" });
  });

  it("returns raw without parsed for invalid JSON", () => {
    const output = { ...baseOutput, stdout: "not json" };
    const result = formatOutput(output, "json");
    expect(result.parsed).toBeUndefined();
    expect(result.raw).toBe("not json");
  });

  it("truncates large output", () => {
    const big = "x".repeat(1024 * 600);
    const output = { ...baseOutput, stdout: big };
    const result = formatOutput(output, "text");
    expect(result.truncated).toBe(true);
    expect(result.raw).toContain("[output truncated]");
  });
});

describe("summarizeOutput", () => {
  it("includes task id, exit code and duration", () => {
    const summary = summarizeOutput(baseOutput);
    expect(summary).toContain("build");
    expect(summary).toContain("123ms");
    expect(summary).toContain("✓");
  });

  it("uses ✗ for non-zero exit", () => {
    const output = { ...baseOutput, exitCode: 1 };
    expect(summarizeOutput(output)).toContain("✗");
  });
});

describe("fingerprintOutput", () => {
  it("returns a 12-char hex string", () => {
    const fp = fingerprintOutput(baseOutput);
    expect(fp).toMatch(/^[0-9a-f]{12}$/);
  });

  it("differs for different stdout", () => {
    const a = fingerprintOutput(baseOutput);
    const b = fingerprintOutput({ ...baseOutput, stdout: "other" });
    expect(a).not.toBe(b);
  });
});
