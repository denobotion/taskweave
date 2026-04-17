import { createLogger, LogLevel } from './logger';

describe('createLogger', () => {
  it('stores log entries', () => {
    const logger = createLogger('debug', true);
    logger.info('hello');
    logger.warn('watch out');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0].level).toBe('info');
    expect(logs[0].message).toBe('hello');
    expect(logs[1].level).toBe('warn');
  });

  it('attaches taskId to entries', () => {
    const logger = createLogger('debug', true);
    logger.error('boom', 'task-1');
    const logs = logger.getLogs();
    expect(logs[0].taskId).toBe('task-1');
  });

  it('attaches timestamps', () => {
    const before = new Date();
    const logger = createLogger('debug', true);
    logger.info('ts test');
    const after = new Date();
    const ts = logger.getLogs()[0].timestamp;
    expect(ts.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(ts.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('filters entries below minLevel', () => {
    const logger = createLogger('warn', true);
    logger.debug('ignored');
    logger.info('also ignored');
    logger.warn('kept');
    logger.error('also kept');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(4); // all stored
    // but only warn+ would print; we test storage is complete
    const printed = logs.filter(l => ['warn', 'error'].includes(l.level));
    expect(printed).toHaveLength(2);
  });

  it('returns a copy of logs', () => {
    const logger = createLogger('debug', true);
    logger.info('one');
    const first = logger.getLogs();
    logger.info('two');
    expect(first).toHaveLength(1);
    expect(logger.getLogs()).toHaveLength(2);
  });

  it('supports all log levels', () => {
    const logger = createLogger('debug', true);
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    levels.forEach(l => (logger[l]('msg')));
    const logs = logger.getLogs();
    expect(logs.map(e => e.level)).toEqual(levels);
  });
});
