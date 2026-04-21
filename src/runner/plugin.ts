import { z } from "zod";

export const PluginHookSchema = z.enum(["beforeTask", "afterTask", "onError", "onSkip"]);
export type PluginHook = z.infer<typeof PluginHookSchema>;

export interface PluginContext {
  taskId: string;
  inputs?: Record<string, unknown>;
  output?: string;
  error?: Error;
}

export interface Plugin {
  name: string;
  version?: string;
  hooks: Partial<Record<PluginHook, (ctx: PluginContext) => Promise<void> | void>>;
}

export interface PluginRegistry {
  plugins: Map<string, Plugin>;
}

export function createPluginRegistry(): PluginRegistry {
  return { plugins: new Map() };
}

export function registerPlugin(registry: PluginRegistry, plugin: Plugin): void {
  if (registry.plugins.has(plugin.name)) {
    throw new Error(`Plugin "${plugin.name}" is already registered`);
  }
  registry.plugins.set(plugin.name, plugin);
}

export function unregisterPlugin(registry: PluginRegistry, name: string): boolean {
  return registry.plugins.delete(name);
}

export async function dispatchPluginHook(
  registry: PluginRegistry,
  hook: PluginHook,
  ctx: PluginContext
): Promise<void> {
  for (const plugin of registry.plugins.values()) {
    const handler = plugin.hooks[hook];
    if (handler) {
      await handler(ctx);
    }
  }
}

export function listPlugins(registry: PluginRegistry): string[] {
  return Array.from(registry.plugins.keys());
}
