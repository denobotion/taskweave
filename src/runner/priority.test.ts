import {
  createPriorityQueue,
  priorityEnqueue,
  priorityDequeue,
  peekPriority,
  isPriorityQueueEmpty,
  formatPriorityLine,
} from "./priority";

describe("createPriorityQueue", () => {
  it("creates an empty queue", () => {
    const q = createPriorityQueue<string>();
    expect(q.size).toBe(0);
    expect(q.entries).toHaveLength(0);
  });
});

describe("priorityEnqueue", () => {
  it("enqueues items and sorts by priority descending", () => {
    let q = createPriorityQueue<string>();
    q = priorityEnqueue(q, "low", 1);
    q = priorityEnqueue(q, "high", 10);
    q = priorityEnqueue(q, "mid", 5);
    expect(q.entries[0].item).toBe("high");
    expect(q.entries[1].item).toBe("mid");
    expect(q.entries[2].item).toBe("low");
    expect(q.size).toBe(3);
  });

  it("maintains FIFO order for equal priorities", () => {
    let q = createPriorityQueue<string>();
    q = priorityEnqueue(q, "first", 5);
    q = priorityEnqueue(q, "second", 5);
    expect(q.entries[0].item).toBe("first");
    expect(q.entries[1].item).toBe("second");
  });

  it("does not mutate the original queue", () => {
    const q = createPriorityQueue<string>();
    const q2 = priorityEnqueue(q, "task", 3);
    expect(q.size).toBe(0);
    expect(q2.size).toBe(1);
  });
});

describe("priorityDequeue", () => {
  it("dequeues the highest priority item", () => {
    let q = createPriorityQueue<string>();
    q = priorityEnqueue(q, "a", 1);
    q = priorityEnqueue(q, "b", 9);
    const { queue: q2, item } = priorityDequeue(q);
    expect(item).toBe("b");
    expect(q2.size).toBe(1);
  });

  it("returns undefined for empty queue", () => {
    const q = createPriorityQueue<string>();
    const { item } = priorityDequeue(q);
    expect(item).toBeUndefined();
  });
});

describe("peekPriority", () => {
  it("returns the top item without removing it", () => {
    let q = createPriorityQueue<string>();
    q = priorityEnqueue(q, "only", 7);
    expect(peekPriority(q)).toBe("only");
    expect(q.size).toBe(1);
  });

  it("returns undefined for empty queue", () => {
    expect(peekPriority(createPriorityQueue())).toBeUndefined();
  });
});

describe("isPriorityQueueEmpty", () => {
  it("returns true for empty queue", () => {
    expect(isPriorityQueueEmpty(createPriorityQueue())).toBe(true);
  });

  it("returns false for non-empty queue", () => {
    const q = priorityEnqueue(createPriorityQueue<string>(), "x", 1);
    expect(isPriorityQueueEmpty(q)).toBe(false);
  });
});

describe("formatPriorityLine", () => {
  it("formats an entry with label", () => {
    const q = priorityEnqueue(createPriorityQueue<string>(), "build", 8);
    const line = formatPriorityLine(q.entries[0], "build");
    expect(line).toMatch(/\[priority=8\]/);
    expect(line).toMatch(/build/);
  });
});
