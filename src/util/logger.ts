export type LogLevel = 'off' | 'trace' | 'error' | 'warn' | 'info' | 'log' | 'verbose' | 'debug';

export class Logger {
  level: LogLevel = 'verbose';

  constructor(level?: LogLevel) {
    this.level = level || 'verbose';
  }

  /**
   * Same as console.log. Will not log if level is 'error' or 'off'
   */
  log(...args: unknown[]): void {
    this.logIfEnabled('log', ...args);
  }

  /**
   * Same as console.info. Will not log if level is 'error' or 'off'
   */
  info(...args: unknown[]): void {
    this.logIfEnabled('info', ...args);
  }

  /**
   * Same as console.debug. Will not log if level is 'error' or 'off'
   */
  debug(...args: unknown[]): void {
    this.logIfEnabled('debug', ...args);
  }

  /**
   * Same as console.warn. Will not log if level is 'error' or 'off'
   */
  warn(...args: unknown[]): void {
    this.logIfEnabled('warn', ...args);
  }

  /**
   * Same as console.error. Will always log
   */
  error(...args: unknown[]): void {
    console.error(...args);
  }

  /**
   * Same as console.trace. Will always log
   */
  trace(...args: unknown[]): void {
    console.trace(...args);
  }

  logIfEnabled(method: keyof typeof console, ...args: unknown[]): void {
    if (this.level === 'off') {
      return;
    }

    if (method !== 'error' && method !== 'trace' && this.level === 'error') {
      return;
    }

    console[method as 'log'](...args);
  }
}
