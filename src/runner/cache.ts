import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface CacheEntry {
  key: string;
  result: unknown;
  timestamp: number;
  ttl: number;
}

export interface CacheStore {
  [key: string]: CacheEntry;
}

export function hashInputs(inputs: Record<string, unknown>): string {
  const serialized = JSON.stringify(inputs, Object.keys(inputs).sort());
  return crypto.createHash('sha256').update(serialized).digest('hex').slice(0, 16);
}

export function isCacheValid(entry: CacheEntry): boolean {
  if (entry.ttl <= 0) return true;
  return Date.now() - entry.timestamp < entry.ttl * 1000;
}

export function readCache(cacheFile: string): CacheStore {
  try {
    const raw = fs.readFileSync(cacheFile, 'utf-8');
    return JSON.parse(raw) as CacheStore;
  } catch {
    return {};
  }
}

export function writeCache(cacheFile: string, store: CacheStore): void {
  const dir = path.dirname(cacheFile);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(cacheFile, JSON.stringify(store, null, 2), 'utf-8');
}

export function getCached(store: CacheStore, key: string): unknown | undefined {
  const entry = store[key];
  if (!entry) return undefined;
  if (!isCacheValid(entry)) return undefined;
  return entry.result;
}

export function setCached(
  store: CacheStore,
  key: string,
  result: unknown,
  ttl: number
): CacheStore {
  return {
    ...store,
    [key]: { key, result, timestamp: Date.now(), ttl },
  };
}
