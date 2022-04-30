export type LogLevels = 'error' | 'off' | string;

export class Logger {
  level: LogLevels = 'verbose';

  constructor(level?: LogLevels) {
    this.level = level;
  }

  /**
   * Same as console.log. Will not log if level is 'error' or 'off'
   */
  log(...args: any[]): void {
    return this.logIfEnabled('log', ...args);
  }

  /**
   * Same as console.info. Will not log if level is 'error' or 'off'
   */
  info(...args: any[]): void {
    return this.logIfEnabled('info', ...args);
  }

  /**
   * Same as console.debug. Will not log if level is 'error' or 'off'
   */
  debug(...args: any[]): void {
    return this.logIfEnabled('debug', ...args);
  }

  /**
   * Same as console.warn. Will not log if level is 'error' or 'off'
   */
  warn(...args: any[]): void {
    return this.logIfEnabled('warn', ...args);
  }

  /**
   * Same as console.error. Will always log
   */
  error(...args: any[]): void {
    return console.error(...args);
  }

  /**
   * Same as console.trace. Will always log
   */
  trace(...args: any[]): void {
    return console.trace(...args);
  }

  logIfEnabled(method: keyof typeof console, ...args: any[]): void {
    if ((this.level as LogLevels) === 'off') {
      return;
    }

    if (method !== 'error' && method !== 'trace' && this.level === 'error') {
      return;
    }

    return console[method as 'log'](...args);
  }
}
