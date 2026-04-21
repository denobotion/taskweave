import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createLockStore,
  acquireLock,
  releaseLock,
  isLockStale,
  listLocks,
  lockPath,
} from "./lock";

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "taskweave-lock-"));
}

describe("createLockStore", () => {
  it("creates the directory if missing", () => {
    const dir = path.join(os.tmpdir(), `tw-lock-${Date.now()}`);
    const store = createLockStore(dir);
    expect(fs.existsSync(dir)).toBe(true);
    expect(store.locks.size).toBe(0);
    fs.rmdirSync(dir);
  });
});

describe("acquireLock", () => {
  it("returns an entry on first acquire", () => {
    const store = createLockStore(tmpDir());
    const entry = acquireLock(store, "build");
    expect(entry).not.toBeNull();
    expect(entry!.taskId).toBe("build");
    expect(entry!.pid).toBe(process.pid);
  });

  it("returns null when lock already held", () => {
    const store = createLockStore(tmpDir());
    acquireLock(store, "build");
    const second = acquireLock(store, "build");
    expect(second).toBeNull();
  });

  it("acquires after stale lock is cleared", () => {
    const store = createLockStore(tmpDir());
    const file = lockPath(store, "test");

    const staleEntry = { taskId: "test", pid: 9999, acquiredAt: Date.now() - 60_000, token: "abc" };
    fs.writeFileSync(file, JSON.stringify(staleEntry));

    const entry = acquireLock(store, "test");
    expect(entry).not.toBeNull();
  });
});

describe("releaseLock", () => {
  it("releases a held lock with correct token", () => {
    const store = createLockStore(tmpDir());
    const entry = acquireLock(store, "deploy")!;
    const released = releaseLock(store, "deploy", entry.token);
    expect(released).toBe(true);
    expect(store.locks.has("deploy")).toBe(false);
  });

  it("returns false for wrong token", () => {
    const store = createLockStore(tmpDir());
    acquireLock(store, "deploy");
    expect(releaseLock(store, "deploy", "wrong-token")).toBe(false);
  });
});

describe("isLockStale", () => {
  it("returns true when past ttl", () => {
    expect(isLockStale({ taskId: "x", pid: 1, acquiredAt: Date.now() - 31_000, token: "t" })).toBe(true);
  });

  it("returns false when within ttl", () => {
    expect(isLockStale({ taskId: "x", pid: 1, acquiredAt: Date.now(), token: "t" })).toBe(false);
  });
});

describe("listLocks", () => {
  it("returns all active locks", () => {
    const store = createLockStore(tmpDir());
    acquireLock(store, "a");
    acquireLock(store, "b");
    expect(listLocks(store).map(e => e.taskId).sort()).toEqual(["a", "b"]);
  });
});
