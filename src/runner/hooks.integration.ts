/**
 * Helpers to wire hooks into the task run lifecycle.
 */
import { HookRegistry, runHooks } from './hooks';
import { log } from './logger';

export async function invokeBeforeHook(
  registry: HookRegistry,
  taskId: string
): Promise<void> {
  log('debug', `[hooks] before:${taskId}`);
  await runHooks(registry, 'before', { taskId, phase: 'before' });
}

export async function invokeAfterHook(
  registry: HookRegistry,
  taskId: string,
  output: string
): Promise<void> {
  log('debug', `[hooks] after:${taskId}`);
  await runHooks(registry, 'after', { taskId, phase: 'after', output });
}

export async function invokeErrorHook(
  registry: HookRegistry,
  taskId: string,
  error: Error
): Promise<void> {
  log('debug', `[hooks] onError:${taskId} — ${error.message}`);
  await runHooks(registry, 'onError', { taskId, phase: 'onError', error });
}

export function buildLoggingHooks(registry: HookRegistry): void {
  registry.hooks.push({
    phase: 'before',
    fn: ({ taskId }) => { log('info', `Starting task: ${taskId}`); },
  });
  registry.hooks.push({
    phase: 'after',
    fn: ({ taskId }) => { log('info', `Completed task: ${taskId}`); },
  });
  registry.hooks.push({
    phase: 'onError',
    fn: ({ taskId, error }) => {
      log('error', `Task failed: ${taskId} — ${error?.message ?? 'unknown'}`);
    },
  });
}
