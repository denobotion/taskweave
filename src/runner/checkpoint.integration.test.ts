import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { initCheckpoint, shouldResumeTask, commitCheckpoint, formatCheckpointLine } from "./checkpoint.integration";
import { createCheckpointStore, recordCheckpoint } from "./checkpoint";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tw-cpint-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("initCheckpoint creates fresh store when resume=false", () => {
  const store = initCheckpoint({ dir: tmpDir, runId: "r1", resume: false });
  expect(store.entries).toEqual({});
});

test("initCheckpoint loads existing store when resume=true", () => {
  let store = createCheckpointStore("r2");
  store = recordCheckpoint(store, "taskX", "completed");
  const { saveCheckpoint } = require("./checkpoint");
  saveCheckpoint(store, tmpDir);

  const loaded = initCheckpoint({ dir: tmpDir, runId: "r2", resume: true });
  expect(loaded.entries["taskX"].status).toBe("completed");
});

test("initCheckpoint creates fresh store when resume=true but no file", () => {
  const store = initCheckpoint({ dir: tmpDir, runId: "missing", resume: true });
  expect(store.entries).toEqual({});
});

test("shouldResumeTask returns true only for completed tasks", () => {
  let store = createCheckpointStore("r3");
  store = recordCheckpoint(store, "taskA", "completed");
  store = recordCheckpoint(store, "taskB", "failed");
  expect(shouldResumeTask(store, "taskA")).toBe(true);
  expect(shouldResumeTask(store, "taskB")).toBe(false);
  expect(shouldResumeTask(store, "taskC")).toBe(false);
});

test("commitCheckpoint persists to disk and returns updated store", () => {
  let store = createCheckpointStore("r4");
  store = commitCheckpoint(store, "build", "completed", tmpDir, "ok");
  expect(store.entries["build"].status).toBe("completed");
  const { loadCheckpoint } = require("./checkpoint");
  const loaded = loadCheckpoint(tmpDir, "r4");
  expect(loaded!.entries["build"].status).toBe("completed");
});

test("formatCheckpointLine formats completed entry", () => {
  const line = formatCheckpointLine("deploy", "completed", new Date("2024-01-01T00:00:00Z").getTime());
  expect(line).toContain("✔");
  expect(line).toContain("deploy");
  expect(line).toContain("completed");
});

test("formatCheckpointLine formats failed entry", () => {
  const line = formatCheckpointLine("test", "failed", Date.now());
  expect(line).toContain("✖");
  expect(line).toContain("test");
});
