import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export interface LockEntry {
  taskId: string;
  pid: number;
  acquiredAt: number;
  token: string;
}

export interface LockStore {
  dir: string;
  locks: Map<string, LockEntry>;
}

export function createLockStore(dir: string): LockStore {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return { dir, locks: new Map() };
}

export function lockPath(store: LockStore, taskId: string): string {
  return path.join(store.dir, `${taskId}.lock`);
}

export function acquireLock(store: LockStore, taskId: string): LockEntry | null {
  const file = lockPath(store, taskId);
  if (fs.existsSync(file)) {
    try {
      const existing: LockEntry = JSON.parse(fs.readFileSync(file, "utf-8"));
      if (isLockStale(existing)) {
        fs.unlinkSync(file);
      } else {
        return null;
      }
    } catch {
      fs.unlinkSync(file);
    }
  }
  const entry: LockEntry = {
    taskId,
    pid: process.pid,
    acquiredAt: Date.now(),
    token: crypto.randomBytes(8).toString("hex"),
  };
  fs.writeFileSync(file, JSON.stringify(entry), { flag: "wx" });
  store.locks.set(taskId, entry);
  return entry;
}

export function releaseLock(store: LockStore, taskId: string, token: string): boolean {
  const file = lockPath(store, taskId);
  const entry = store.locks.get(taskId);
  if (!entry || entry.token !== token) return false;
  if (fs.existsSync(file)) fs.unlinkSync(file);
  store.locks.delete(taskId);
  return true;
}

export function isLockStale(entry: LockEntry, ttlMs = 30_000): boolean {
  return Date.now() - entry.acquiredAt > ttlMs;
}

export function listLocks(store: LockStore): LockEntry[] {
  return Array.from(store.locks.values());
}
