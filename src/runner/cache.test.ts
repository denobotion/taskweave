import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  hashInputs,
  isCacheValid,
  readCache,
  writeCache,
  getCached,
  setCached,
  CacheEntry,
} from './cache';

const TMP = path.join(__dirname, '__cache_test_tmp__');
const CACHE_FILE = path.join(TMP, 'cache.json');

beforeEach(() => { if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true }); });
afterEach(() => { if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true }); });

describe('hashInputs', () => {
  it('returns consistent hash for same inputs', () => {
    expect(hashInputs({ a: 1, b: 2 })).toBe(hashInputs({ b: 2, a: 1 }));
  });
  it('returns different hash for different inputs', () => {
    expect(hashInputs({ a: 1 })).not.toBe(hashInputs({ a: 2 }));
  });
});

describe('isCacheValid', () => {
  it('returns true when ttl is 0', () => {
    const entry: CacheEntry = { key: 'k', result: 'v', timestamp: 0, ttl: 0 };
    expect(isCacheValid(entry)).toBe(true);
  });
  it('returns true when within ttl', () => {
    const entry: CacheEntry = { key: 'k', result: 'v', timestamp: Date.now(), ttl: 60 };
    expect(isCacheValid(entry)).toBe(true);
  });
  it('returns false when expired', () => {
    const entry: CacheEntry = { key: 'k', result: 'v', timestamp: Date.now() - 10000, ttl: 5 };
    expect(isCacheValid(entry)).toBe(false);
  });
});

describe('readCache / writeCache', () => {
  it('returns empty store when file missing', () => {
    expect(readCache(CACHE_FILE)).toEqual({});
  });
  it('round-trips store to disk', () => {
    const store = setCached({}, 'key1', { output: 'hello' }, 0);
    writeCache(CACHE_FILE, store);
    expect(readCache(CACHE_FILE)).toMatchObject({ key1: { result: { output: 'hello' } } });
  });
});

describe('getCached / setCached', () => {
  it('returns undefined for missing key', () => {
    expect(getCached({}, 'missing')).toBeUndefined();
  });
  it('returns result for valid entry', () => {
    const store = setCached({}, 'k', 42, 60);
    expect(getCached(store, 'k')).toBe(42);
  });
  it('returns undefined for expired entry', () => {
    const store: ReturnType<typeof setCached> = {
      k: { key: 'k', result: 99, timestamp: Date.now() - 9999, ttl: 1 },
    };
    expect(getCached(store, 'k')).toBeUndefined();
  });
});
