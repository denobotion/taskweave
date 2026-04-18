import * as path from 'path';
import { hashInputs, readCache, writeCache, getCached, setCached } from './cache';
import { createLogger, log } from './logger';

const DEFAULT_CACHE_FILE = path.join(process.cwd(), '.taskweave', 'cache.json');

export interface TaskCacheOptions {
  taskId: string;
  inputs: Record<string, unknown>;
  ttl?: number;
  cacheFile?: string;
}

export function buildCacheKey(taskId: string, inputs: Record<string, unknown>): string {
  return `${taskId}:${hashInputs(inputs)}`;
}

export async function withCache<T>(
  options: TaskCacheOptions,
  fn: () => Promise<T>
): Promise<T> {
  const { taskId, inputs, ttl = 0, cacheFile = DEFAULT_CACHE_FILE } = options;
  const logger = createLogger('cache');
  const key = buildCacheKey(taskId, inputs);
  const store = readCache(cacheFile);
  const cached = getCached(store, key);

  if (cached !== undefined) {
    log(logger, 'info', `Cache hit for task "${taskId}" [${key}]`);
    return cached as T;
  }

  log(logger, 'info', `Cache miss for task "${taskId}" [${key}]`);
  const result = await fn();
  const updated = setCached(store, key, result, ttl);
  writeCache(cacheFile, updated);
  return result;
}

export function invalidateCache(taskId: string, inputs: Record<string, unknown>, cacheFile = DEFAULT_CACHE_FILE): void {
  const key = buildCacheKey(taskId, inputs);
  const store = readCache(cacheFile);
  if (key in store) {
    const { [key]: _removed, ...rest } = store;
    writeCache(cacheFile, rest);
  }
}
