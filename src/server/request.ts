import { IncomingMessage } from 'http';
import { Socket } from 'net';
import { HandlerVariables } from '../router/router';
import { getId } from '../util/format';

export class MoxyRequest extends IncomingMessage {
  /**
   * Unique request UUID
   */
  id: string;
  /**
   * The unix timestamp of the request
   */
  timestamp: number;

  #query?: HandlerVariables;
  #path?: string;
  #body?: Promise<Buffer>;

  constructor(socket: Socket) {
    super(socket);

    this.id = getId();
    this.timestamp = Date.now();
  }

  /**
   * A promise which resolves to the request body
   */
  get body(): Promise<Buffer> {
    if (!this.#body) {
      this.#body = new Promise((resolve) => {
        const data: Uint8Array[] = [];

        this.on('data', (chunk: Uint8Array) => data.push(chunk));
        this.on('end', () => {
          resolve(Buffer.concat(data));
        });
      });
    }

    return this.#body;
  }

  /**
   * Get the parsed query params
   *
   * @type {ParsedUrlQuery}
   */
  get query(): HandlerVariables {
    if (this.#query) {
      return this.#query;
    }
    if (this.url) {
      return Object.fromEntries(new URL('http://example.com' + this.url).searchParams.entries());
    }
    return {};
  }

  /**
   * Get the request path without hash or search
   *
   * @type {string}
   */
  get path(): string | undefined {
    return this.#path || this.url?.replace(/[?#].*/, '');
  }

  /**
   * Gets the body
   *
   * @param {string}  format  The desired body format (defaults to content-type header)
   */
  async getBody(format: 'buffer'): Promise<Buffer>;
  async getBody(format: 'string'): Promise<string>;
  async getBody(format: 'json'): Promise<Record<string, unknown>>;
  async getBody(format?: 'buffer' | 'string' | 'json'): Promise<Buffer | string | Record<string, unknown>> {
    const payload = await this.body;

    if (format === 'string') {
      return (payload.toString('utf8') as string | null) ?? '';
    }

    if (format === 'json') {
      return JSON.parse((await this.body).toString('utf8') || '{}') as Record<string, unknown>;
    }

    return this.parseBody(await this.body);
  }

  /**
   * Parse the body using conten-type header
   *
   * @param  {Buffer} body  The body
   *
   * @return {(Buffer | Record<string, unknown> | string)}
   */
  parseBody(body: Buffer): string | Buffer | Record<string, unknown> {
    const content = this.headers['Content-Type'] as string;

    if (!content) {
      return body;
    }

    if (/text\//.test(content)) {
      return body.toString('utf8');
    }

    if (/application\/json/.test(content)) {
      return JSON.parse(body.toString('utf8') || '{}') as Record<string, unknown>;
    }

    return body;
  }
}
