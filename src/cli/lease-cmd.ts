import type { Command } from "commander";
import {
  createLeaseStore,
  acquireLease,
  releaseLease,
  isLeaseHeld,
  formatLeaseLine,
} from "../runner/lease";

const store = createLeaseStore();

export function registerLeaseCmd(program: Command): void {
  const lease = program
    .command("lease")
    .description("Manage task leases");

  lease
    .command("acquire <taskId> <holder>")
    .description("Acquire a lease for a task")
    .option("--ttl <ms>", "Lease TTL in milliseconds", "30000")
    .action((taskId: string, holder: string, opts: { ttl: string }) => {
      const ttlMs = parseInt(opts.ttl, 10);
      if (isNaN(ttlMs) || ttlMs <= 0) {
        console.error("error: --ttl must be a positive integer");
        process.exit(1);
      }
      const result = acquireLease(store, taskId, holder, ttlMs);
      if (!result) {
        console.error(`error: lease for task "${taskId}" is already held`);
        process.exit(1);
      }
      console.log(formatLeaseLine(result));
    });

  lease
    .command("release <taskId> <leaseId>")
    .description("Release a held lease")
    .action((taskId: string, leaseId: string) => {
      const ok = releaseLease(store, taskId, leaseId);
      if (!ok) {
        console.error(`error: no matching lease found for task "${taskId}"`);
        process.exit(1);
      }
      console.log(`released lease for task=${taskId}`);
    });

  lease
    .command("status <taskId>")
    .description("Check whether a task lease is currently held")
    .action((taskId: string) => {
      const held = isLeaseHeld(store, taskId);
      console.log(`task=${taskId} held=${held}`);
    });
}
