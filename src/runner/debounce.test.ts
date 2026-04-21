import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDebounce } from "./debounce";

describe("createDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("invokes fn after wait period on trailing edge", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100 });

    d.trigger();
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("resets timer on subsequent triggers", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100 });

    d.trigger();
    vi.advanceTimersByTime(50);
    d.trigger();
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("invokes immediately on leading edge", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100, leading: true });

    d.trigger();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("cancel prevents invocation", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100 });

    d.trigger();
    d.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush invokes immediately if pending", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100 });

    d.trigger();
    expect(d.isPending()).toBe(true);
    d.flush();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(d.isPending()).toBe(false);
  });

  it("flush does nothing if not pending", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100 });

    d.flush();
    expect(fn).not.toHaveBeenCalled();
  });

  it("respects maxWait by forcing invocation", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 100, maxWait: 250 });

    d.trigger();
    vi.advanceTimersByTime(90);
    d.trigger();
    vi.advanceTimersByTime(90);
    d.trigger();
    vi.advanceTimersByTime(90);
    // total elapsed: 270ms > maxWait(250ms)
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("isPending returns false after invocation", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { wait: 50 });

    d.trigger();
    expect(d.isPending()).toBe(true);
    vi.advanceTimersByTime(50);
    expect(d.isPending()).toBe(false);
  });
});
