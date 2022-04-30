import { Socket } from 'net';
import { IncomingMessage } from 'http';
import { ParsedUrlQuery } from 'querystring';
import { parse } from 'url';
import { randomUUID } from 'crypto';

export class MoxyRequest extends IncomingMessage {
  /**
   * A promise which resolves to the request body
   */
  body: Promise<Buffer>;
  /**
   * Unique request UUID
   */
  id: string;
  /**
   * The unix timestamp of the request
   */
  timestamp: number;

  #query: ParsedUrlQuery;
  #path: string;

  constructor(socket: Socket) {
    super(socket);

    this.id = randomUUID();
    this.timestamp = Date.now();

    this.body = new Promise((resolve) => {
      const data: any[] = [];

      this.on('data', (chunk) => data.push(chunk));
      this.on('end', () => resolve(Buffer.concat(data)));
    });
  }

  /**
   * Get the parsed query params
   *
   * @type {ParsedUrlQuery}
   */
  get query(): ParsedUrlQuery {
    return this.#query || parse(this.url, true)?.query;
  }

  /**
   * Get the request path without hash or search
   *
   * @type {string}
   */
  get path(): string {
    return this.#path || this.url?.replace(/[?#].*/, '');
  }

  /**
   * Gets the body
   *
   * @param {string}  format  The desired body format (defaults to content-type header)
   */
  async getBody(format: 'buffer'): Promise<Buffer>;
  async getBody(format: 'string'): Promise<string>;
  async getBody(format: 'json'): Promise<Record<string, any>>;
  async getBody(format?: 'buffer' | 'string' | 'json'): Promise<Buffer | string | Record<string, any>> {
    const payload = await this.body;

    if (format === 'string') {
      return payload?.toString('utf8') ?? '';
    }

    if (format === 'json') {
      return JSON.parse((await this.body)?.toString('utf8') || '{}');
    }

    return this.parseBody(await this.body);
  }

  /**
   * Parse the body using conten-type header
   *
   * @param  {Buffer} body  The body
   *
   * @return {(Buffer | Record<string, any> | string)}
   */
  parseBody(body: Buffer): string | Buffer | Record<string, any> {
    const content = this.headers['Content-Type'] as string;

    if (!content) {
      return body;
    }

    if (/text\//.test(content)) {
      return body?.toString('utf8');
    }

    if (/application\/json/.test(content)) {
      return JSON.parse(body?.toString('utf8') || '{}');
    }

    return body;
  }
}
