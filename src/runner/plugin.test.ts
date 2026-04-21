import { describe, it, expect, vi } from "vitest";
import {
  createPluginRegistry,
  registerPlugin,
  unregisterPlugin,
  dispatchPluginHook,
  listPlugins,
  Plugin,
} from "./plugin";

function makePlugin(name: string, hooks: Plugin["hooks"] = {}): Plugin {
  return { name, version: "1.0.0", hooks };
}

describe("createPluginRegistry", () => {
  it("creates an empty registry", () => {
    const registry = createPluginRegistry();
    expect(registry.plugins.size).toBe(0);
  });
});

describe("registerPlugin", () => {
  it("registers a plugin by name", () => {
    const registry = createPluginRegistry();
    registerPlugin(registry, makePlugin("my-plugin"));
    expect(registry.plugins.has("my-plugin")).toBe(true);
  });

  it("throws if plugin name is already registered", () => {
    const registry = createPluginRegistry();
    registerPlugin(registry, makePlugin("dup"));
    expect(() => registerPlugin(registry, makePlugin("dup"))).toThrow(
      'Plugin "dup" is already registered'
    );
  });
});

describe("unregisterPlugin", () => {
  it("removes a registered plugin and returns true", () => {
    const registry = createPluginRegistry();
    registerPlugin(registry, makePlugin("p1"));
    expect(unregisterPlugin(registry, "p1")).toBe(true);
    expect(registry.plugins.has("p1")).toBe(false);
  });

  it("returns false for unknown plugin", () => {
    const registry = createPluginRegistry();
    expect(unregisterPlugin(registry, "ghost")).toBe(false);
  });
});

describe("dispatchPluginHook", () => {
  it("calls matching hooks on all plugins", async () => {
    const registry = createPluginRegistry();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    registerPlugin(registry, makePlugin("a", { beforeTask: fn1 }));
    registerPlugin(registry, makePlugin("b", { beforeTask: fn2 }));
    const ctx = { taskId: "build" };
    await dispatchPluginHook(registry, "beforeTask", ctx);
    expect(fn1).toHaveBeenCalledWith(ctx);
    expect(fn2).toHaveBeenCalledWith(ctx);
  });

  it("skips plugins without the requested hook", async () => {
    const registry = createPluginRegistry();
    const fn = vi.fn();
    registerPlugin(registry, makePlugin("c", { afterTask: fn }));
    await dispatchPluginHook(registry, "beforeTask", { taskId: "x" });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("listPlugins", () => {
  it("returns names of all registered plugins", () => {
    const registry = createPluginRegistry();
    registerPlugin(registry, makePlugin("alpha"));
    registerPlugin(registry, makePlugin("beta"));
    expect(listPlugins(registry)).toEqual(["alpha", "beta"]);
  });
});
