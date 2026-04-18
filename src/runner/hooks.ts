export type HookPhase = 'before' | 'after' | 'onError';

export interface Hook {
  phase: HookPhase;
  taskId?: string; // undefined = global
  fn: (ctx: HookContext) => Promise<void> | void;
}

export interface HookContext {
  taskId: string;
  phase: HookPhase;
  error?: Error;
  output?: string;
}

export interface HookRegistry {
  hooks: Hook[];
}

export function createHookRegistry(): HookRegistry {
  return { hooks: [] };
}

export function registerHook(registry: HookRegistry, hook: Hook): void {
  registry.hooks.push(hook);
}

export async function runHooks(
  registry: HookRegistry,
  phase: HookPhase,
  ctx: HookContext
): Promise<void> {
  const matching = registry.hooks.filter(
    (h) => h.phase === phase && (h.taskId === undefined || h.taskId === ctx.taskId)
  );
  for (const hook of matching) {
    await hook.fn(ctx);
  }
}
