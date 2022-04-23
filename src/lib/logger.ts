export type LogLevels = 'error' | 'off' | string;

export class Logger {
  /**
   * Same as console.log. Will not log if level is 'error' or 'off'.
   */
  static log(...args: any[]): void {
    return this.logIfEnabled('log', ...args);
  }

  /**
   * Same as console.info. Will not log if level is 'error' or 'off'.
   */
  static info(...args: any[]): void {
    return this.logIfEnabled('info', ...args);
  }

  /**
   * Same as console.debug. Will not log if level is 'error' or 'off'.
   */
  static debug(...args: any[]): void {
    return this.logIfEnabled('debug', ...args);
  }

  /**
   * Same as console.warn. Will not log if level is 'error' or 'off'.
   */
  static warn(...args: any[]): void {
    return this.logIfEnabled('warn', ...args);
  }

  /**
   * Same as console.error. Will always log.
   */
  static error(...args: any[]): void {
    return console.error(...args);
  }

  /**
   * Same as console.trace. Will always log.
   */
  static trace(...args: any[]): void {
    return console.trace(...args);
  }

  static logIfEnabled(method: keyof typeof console, ...args: any[]): void {
    const level = process.env.MOXY_LOG as LogLevels;

    if ((level as LogLevels) === 'off') {
      return;
    }

    if (method !== 'error' && method !== 'trace' && level === 'error') {
      return;
    }

    return console[method as 'log'](...args);
  }
}
