import { createWriteStream, WriteStream } from "fs";
import { join } from "path";

export interface TeeStore {
  streams: Map<string, WriteStream>;
  buffers: Map<string, string[]>;
  maxBuffer: number;
}

export function createTeeStore(maxBuffer = 1000): TeeStore {
  return {
    streams: new Map(),
    buffers: new Map(),
    maxBuffer,
  };
}

export function openTee(
  store: TeeStore,
  id: string,
  filePath: string
): WriteStream {
  if (store.streams.has(id)) {
    return store.streams.get(id)!;
  }
  const ws = createWriteStream(filePath, { flags: "a" });
  store.streams.set(id, ws);
  store.buffers.set(id, []);
  return ws;
}

export function writeTee(
  store: TeeStore,
  id: string,
  line: string
): void {
  const ws = store.streams.get(id);
  if (ws) {
    ws.write(line + "\n");
  }
  const buf = store.buffers.get(id) ?? [];
  buf.push(line);
  if (buf.length > store.maxBuffer) {
    buf.shift();
  }
  store.buffers.set(id, buf);
}

export function flushTee(
  store: TeeStore,
  id: string
): Promise<void> {
  return new Promise((resolve) => {
    const ws = store.streams.get(id);
    if (!ws) return resolve();
    ws.end(resolve);
    store.streams.delete(id);
  });
}

export function getTeeBuffer(store: TeeStore, id: string): string[] {
  return store.buffers.get(id) ?? [];
}

export function closeTeeStore(store: TeeStore): Promise<void[]> {
  const ids = Array.from(store.streams.keys());
  return Promise.all(ids.map((id) => flushTee(store, id)));
}

export function formatTeeLine(
  taskId: string,
  line: string,
  timestamp: number
): string {
  return `[${new Date(timestamp).toISOString()}] [${taskId}] ${line}`;
}
