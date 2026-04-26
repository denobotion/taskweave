/**
 * Semaphore — limits concurrent access to a shared resource.
 * Callers acquire a slot and release it when done.
 */

export interface Semaphore {
  readonly capacity: number;
  readonly available: number;
  readonly pending: number;
}

export interface SemaphoreHandle {
  readonly id: string;
  release(): void;
}

interface WaitEntry {
  resolve: (handle: SemaphoreHandle) => void;
}

export function createSemaphore(capacity: number): Semaphore & {
  acquire(id?: string): Promise<SemaphoreHandle>;
} {
  if (capacity < 1) throw new RangeError("Semaphore capacity must be >= 1");

  let active = 0;
  const waitQueue: WaitEntry[] = [];

  function makeHandle(id: string): SemaphoreHandle {
    return {
      id,
      release() {
        active -= 1;
        drain();
      },
    };
  }

  function drain(): void {
    while (active < capacity && waitQueue.length > 0) {
      const entry = waitQueue.shift()!;
      active += 1;
      entry.resolve(makeHandle(String(Date.now())));
    }
  }

  const sem = {
    get capacity() {
      return capacity;
    },
    get available() {
      return Math.max(0, capacity - active);
    },
    get pending() {
      return waitQueue.length;
    },
    acquire(id = String(Date.now())): Promise<SemaphoreHandle> {
      if (active < capacity) {
        active += 1;
        return Promise.resolve(makeHandle(id));
      }
      return new Promise<SemaphoreHandle>((resolve) => {
        waitQueue.push({ resolve });
      });
    },
  };

  return sem;
}

export function formatSemaphoreLine(sem: Semaphore): string {
  return `semaphore capacity=${sem.capacity} available=${sem.available} pending=${sem.pending}`;
}
