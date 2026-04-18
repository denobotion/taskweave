import { describe, it, expect, vi } from 'vitest';
import {
  createHookRegistry,
  registerHook,
  runHooks,
} from './hooks';

describe('createHookRegistry', () => {
  it('returns empty registry', () => {
    const r = createHookRegistry();
    expect(r.hooks).toHaveLength(0);
  });
});

describe('registerHook', () => {
  it('adds hook to registry', () => {
    const r = createHookRegistry();
    registerHook(r, { phase: 'before', fn: vi.fn() });
    expect(r.hooks).toHaveLength(1);
  });
});

describe('runHooks', () => {
  it('calls matching phase hooks', async () => {
    const r = createHookRegistry();
    const fn = vi.fn();
    registerHook(r, { phase: 'before', fn });
    await runHooks(r, 'before', { taskId: 'task1', phase: 'before' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('skips hooks for different phase', async () => {
    const r = createHookRegistry();
    const fn = vi.fn();
    registerHook(r, { phase: 'after', fn });
    await runHooks(r, 'before', { taskId: 'task1', phase: 'before' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('filters by taskId when specified', async () => {
    const r = createHookRegistry();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    registerHook(r, { phase: 'before', taskId: 'task1', fn: fn1 });
    registerHook(r, { phase: 'before', taskId: 'task2', fn: fn2 });
    await runHooks(r, 'before', { taskId: 'task1', phase: 'before' });
    expect(fn1).toHaveBeenCalledOnce();
    expect(fn2).not.toHaveBeenCalled();
  });

  it('runs global hooks for any taskId', async () => {
    const r = createHookRegistry();
    const fn = vi.fn();
    registerHook(r, { phase: 'after', fn });
    await runHooks(r, 'after', { taskId: 'anyTask', phase: 'after' });
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes context to hook fn', async () => {
    const r = createHookRegistry();
    const fn = vi.fn();
    registerHook(r, { phase: 'onError', fn });
    const ctx = { taskId: 't1', phase: 'onError' as const, error: new Error('fail') };
    await runHooks(r, 'onError', ctx);
    expect(fn).toHaveBeenCalledWith(ctx);
  });
});
