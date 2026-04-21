import {
  createQueue,
  enqueue,
  dequeue,
  isQueueEmpty,
  canDequeue,
  peekQueue,
  removeFromQueue,
} from './queue';

describe('createQueue', () => {
  it('creates an empty queue with default concurrency', () => {
    const q = createQueue();
    expect(q.items).toHaveLength(0);
    expect(q.concurrency).toBe(4);
    expect(q.running).toBe(0);
  });

  it('respects custom concurrency', () => {
    const q = createQueue(2);
    expect(q.concurrency).toBe(2);
  });
});

describe('enqueue', () => {
  it('adds an item to the queue', () => {
    let q = createQueue<string>();
    q = enqueue(q, 'a', 'task-a');
    expect(q.items).toHaveLength(1);
    expect(q.items[0].id).toBe('a');
  });

  it('sorts by priority: high before normal before low', () => {
    let q = createQueue<string>();
    q = enqueue(q, 'low', 'task-low', 'low');
    q = enqueue(q, 'normal', 'task-normal', 'normal');
    q = enqueue(q, 'high', 'task-high', 'high');
    expect(q.items.map((i) => i.priority)).toEqual(['high', 'normal', 'low']);
  });

  it('preserves FIFO order within same priority', () => {
    let q = createQueue<string>();
    q = enqueue(q, 'a', 'task-a', 'normal');
    q = enqueue(q, 'b', 'task-b', 'normal');
    expect(q.items[0].id).toBe('a');
    expect(q.items[1].id).toBe('b');
  });
});

describe('dequeue', () => {
  it('returns undefined for empty queue', () => {
    const q = createQueue<string>();
    const [item] = dequeue(q);
    expect(item).toBeUndefined();
  });

  it('removes and returns the head item', () => {
    let q = createQueue<string>();
    q = enqueue(q, 'x', 'task-x');
    const [item, next] = dequeue(q);
    expect(item?.id).toBe('x');
    expect(next.items).toHaveLength(0);
  });
});

describe('isQueueEmpty', () => {
  it('returns true when no items and nothing running', () => {
    expect(isQueueEmpty(createQueue())).toBe(true);
  });

  it('returns false when items exist', () => {
    const q = enqueue(createQueue<string>(), 'a', 'task');
    expect(isQueueEmpty(q)).toBe(false);
  });
});

describe('canDequeue', () => {
  it('returns false when queue is empty', () => {
    expect(canDequeue(createQueue())).toBe(false);
  });

  it('returns false when at concurrency limit', () => {
    let q = createQueue<string>(1);
    q = enqueue(q, 'a', 'task');
    q = { ...q, running: 1 };
    expect(canDequeue(q)).toBe(false);
  });

  it('returns true when items exist and below limit', () => {
    let q = createQueue<string>(2);
    q = enqueue(q, 'a', 'task');
    expect(canDequeue(q)).toBe(true);
  });
});

describe('removeFromQueue', () => {
  it('removes item by id', () => {
    let q = createQueue<string>();
    q = enqueue(q, 'a', 'task-a');
    q = enqueue(q, 'b', 'task-b');
    q = removeFromQueue(q, 'a');
    expect(q.items.map((i) => i.id)).toEqual(['b']);
  });
});
