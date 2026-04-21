import { describe, it, expect, vi } from "vitest";
import {
  createSignalController,
  isAborted,
} from "./signal";

describe("createSignalController", () => {
  it("initializes with aborted=false and paused=false", () => {
    const ctrl = createSignalController();
    expect(ctrl.state.aborted).toBe(false);
    expect(ctrl.state.paused).toBe(false);
  });

  it("abort sets aborted=true and emits event", () => {
    const ctrl = createSignalController();
    const fn = vi.fn();
    ctrl.onAbort(fn);
    ctrl.abort();
    expect(ctrl.state.aborted).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("abort is idempotent", () => {
    const ctrl = createSignalController();
    const fn = vi.fn();
    ctrl.onAbort(fn);
    ctrl.abort();
    ctrl.abort();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("pause sets paused=true and emits event", () => {
    const ctrl = createSignalController();
    const fn = vi.fn();
    ctrl.onPause(fn);
    ctrl.pause();
    expect(ctrl.state.paused).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("resume clears paused and emits event", () => {
    const ctrl = createSignalController();
    const fn = vi.fn();
    ctrl.onResume(fn);
    ctrl.pause();
    ctrl.resume();
    expect(ctrl.state.paused).toBe(false);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("pause does not fire when already aborted", () => {
    const ctrl = createSignalController();
    const fn = vi.fn();
    ctrl.onPause(fn);
    ctrl.abort();
    ctrl.pause();
    expect(fn).not.toHaveBeenCalled();
  });

  it("waitIfPaused resolves immediately when not paused", async () => {
    const ctrl = createSignalController();
    await expect(ctrl.waitIfPaused()).resolves.toBeUndefined();
  });

  it("waitIfPaused resolves after resume", async () => {
    const ctrl = createSignalController();
    ctrl.pause();
    const promise = ctrl.waitIfPaused();
    setTimeout(() => ctrl.resume(), 10);
    await expect(promise).resolves.toBeUndefined();
  });

  it("isAborted reflects controller state", () => {
    const ctrl = createSignalController();
    expect(isAborted(ctrl)).toBe(false);
    ctrl.abort();
    expect(isAborted(ctrl)).toBe(true);
  });
});
