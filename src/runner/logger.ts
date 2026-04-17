export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  taskId?: string;
  timestamp: Date;
}

export interface Logger {
  debug(message: string, taskId?: string): void;
  info(message: string, taskId?: string): void;
  warn(message: string, taskId?: string): void;
  error(message: string, taskId?: string): void;
  getLogs(): LogEntry[];
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LEVEL_PREFIX: Record<LogLevel, string> = {
  debug: '\x1b[90m[DEBUG]\x1b[0m',
  info:  '\x1b[36m[INFO]\x1b[0m ',
  warn:  '\x1b[33m[WARN]\x1b[0m ',
  error: '\x1b[31m[ERROR]\x1b[0m',
};

export function createLogger(minLevel: LogLevel = 'info', silent = false): Logger {
  const logs: LogEntry[] = [];

  function log(level: LogLevel, message: string, taskId?: string): void {
    const entry: LogEntry = { level, message, taskId, timestamp: new Date() };
    logs.push(entry);

    if (silent || LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

    const prefix = LEVEL_PREFIX[level];
    const tag = taskId ? ` \x1b[35m[${taskId}]\x1b[0m` : '';
    console.log(`${prefix}${tag} ${message}`);
  }

  return {
    debug: (msg, taskId) => log('debug', msg, taskId),
    info:  (msg, taskId) => log('info',  msg, taskId),
    warn:  (msg, taskId) => log('warn',  msg, taskId),
    error: (msg, taskId) => log('error', msg, taskId),
    getLogs: () => [...logs],
  };
}

export const defaultLogger = createLogger();
