import { createThrottle, withThrottle } from './throttle';

describe('createThrottle', () => {
  it('throws if concurrency < 1', () => {
    expect(() => createThrottle({ concurrency: 0 })).toThrow('concurrency must be >= 1');
  });

  it('allows up to concurrency tasks immediately', async () => {
    const t = createThrottle({ concurrency: 2 });
    await t.acquire();
    await t.acquire();
    expect(t.active).toBe(2);
    expect(t.pending).toBe(0);
  });

  it('queues tasks beyond concurrency limit', async () => {
    const t = createThrottle({ concurrency: 1 });
    await t.acquire();
    let resolved = false;
    const p = t.acquire().then(() => { resolved = true; });
    expect(t.pending).toBe(1);
    expect(resolved).toBe(false);
    t.release();
    await p;
    expect(resolved).toBe(true);
    expect(t.active).toBe(1);
  });

  it('release decrements active count', async () => {
    const t = createThrottle({ concurrency: 2 });
    await t.acquire();
    expect(t.active).toBe(1);
    t.release();
    expect(t.active).toBe(0);
  });
});

describe('withThrottle', () => {
  it('runs fn and releases slot on success', async () => {
    const t = createThrottle({ concurrency: 1 });
    const result = await withThrottle(t, async () => 42);
    expect(result).toBe(42);
    expect(t.active).toBe(0);
  });

  it('releases slot even if fn throws', async () => {
    const t = createThrottle({ concurrency: 1 });
    await expect(withThrottle(t, async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    expect(t.active).toBe(0);
  });

  it('limits parallel executions', async () => {
    const t = createThrottle({ concurrency: 2 });
    let running = 0;
    let maxRunning = 0;
    const task = () => withThrottle(t, async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise(r => setTimeout(r, 10));
      running--;
    });
    await Promise.all([task(), task(), task(), task()]);
    expect(maxRunning).toBe(2);
  });
});
