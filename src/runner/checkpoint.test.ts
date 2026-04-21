import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import {
  createCheckpointStore,
  recordCheckpoint,
  isTaskCheckpointed,
  saveCheckpoint,
  loadCheckpoint,
  clearCheckpoint,
  checkpointPath,
} from "./checkpoint";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "tw-cp-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("createCheckpointStore returns empty store", () => {
  const store = createCheckpointStore("run-1");
  expect(store.runId).toBe("run-1");
  expect(store.entries).toEqual({});
});

test("recordCheckpoint adds entry", () => {
  let store = createCheckpointStore("run-1");
  store = recordCheckpoint(store, "taskA", "completed", "hello");
  expect(store.entries["taskA"].status).toBe("completed");
  expect(store.entries["taskA"].outputHash).toBeDefined();
});

test("isTaskCheckpointed returns true for completed tasks", () => {
  let store = createCheckpointStore("run-1");
  store = recordCheckpoint(store, "taskA", "completed");
  expect(isTaskCheckpointed(store, "taskA")).toBe(true);
  expect(isTaskCheckpointed(store, "taskB")).toBe(false);
});

test("isTaskCheckpointed returns false for failed tasks", () => {
  let store = createCheckpointStore("run-1");
  store = recordCheckpoint(store, "taskA", "failed");
  expect(isTaskCheckpointed(store, "taskA")).toBe(false);
});

test("saveCheckpoint and loadCheckpoint round-trip", () => {
  let store = createCheckpointStore("run-42");
  store = recordCheckpoint(store, "build", "completed", "output");
  saveCheckpoint(store, tmpDir);
  const loaded = loadCheckpoint(tmpDir, "run-42");
  expect(loaded).not.toBeNull();
  expect(loaded!.entries["build"].status).toBe("completed");
});

test("loadCheckpoint returns null if file missing", () => {
  expect(loadCheckpoint(tmpDir, "nonexistent")).toBeNull();
});

test("clearCheckpoint removes the file", () => {
  let store = createCheckpointStore("run-99");
  saveCheckpoint(store, tmpDir);
  const fp = checkpointPath(tmpDir, "run-99");
  expect(fs.existsSync(fp)).toBe(true);
  clearCheckpoint(tmpDir, "run-99");
  expect(fs.existsSync(fp)).toBe(false);
});
