import { Command } from "commander";
import * as path from "path";
import { createLockStore, acquireLock, releaseLock, listLocks, isLockStale } from "../runner/lock";

const DEFAULT_LOCK_DIR = path.join(process.cwd(), ".taskweave", "locks");

export function registerLockCmd(program: Command): void {
  const lock = program.command("lock").description("manage task execution locks");

  lock
    .command("list")
    .description("list all active locks")
    .option("--lock-dir <dir>", "lock directory", DEFAULT_LOCK_DIR)
    .action((opts) => {
      const store = createLockStore(opts.lockDir);
      const locks = listLocks(store);
      if (locks.length === 0) {
        console.log("No active locks.");
        return;
      }
      for (const entry of locks) {
        const age = Math.round((Date.now() - entry.acquiredAt) / 1000);
        const stale = isLockStale(entry) ? " [STALE]" : "";
        console.log(`  ${entry.taskId}  pid=${entry.pid}  age=${age}s${stale}`);
      }
    });

  lock
    .command("acquire <taskId>")
    .description("manually acquire a lock for a task")
    .option("--lock-dir <dir>", "lock directory", DEFAULT_LOCK_DIR)
    .action((taskId: string, opts) => {
      const store = createLockStore(opts.lockDir);
      const entry = acquireLock(store, taskId);
      if (!entry) {
        console.error(`Lock for "${taskId}" is already held.`);
        process.exit(1);
      }
      console.log(`Acquired lock for "${taskId}" (token: ${entry.token})`);
    });

  lock
    .command("release <taskId> <token>")
    .description("release a lock using its token")
    .option("--lock-dir <dir>", "lock directory", DEFAULT_LOCK_DIR)
    .action((taskId: string, token: string, opts) => {
      const store = createLockStore(opts.lockDir);
      const ok = releaseLock(store, taskId, token);
      if (!ok) {
        console.error(`Failed to release lock for "${taskId}": invalid token or not held.`);
        process.exit(1);
      }
      console.log(`Released lock for "${taskId}".`);
    });
}
