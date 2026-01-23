import * as fs from 'node:fs';
import { OutgoingHttpHeaders, ServerResponse } from 'node:http';
import * as path from 'node:path';
import { extToMimeType } from '../util/common-extensions';
import { MoxyRequest } from './request';

export interface SendOptions {
  headers?: OutgoingHttpHeaders;
  status?: number;
}

export class MoxyResponse extends ServerResponse<MoxyRequest> {
  /**
   * Unique request UUID
   */
  id: string;
  /**
   * Request duration in ms
   */
  duration?: number;

  #chunks: Uint8Array[] = [];

  constructor(req: MoxyRequest) {
    super(req);

    this.id = req.id;

    this.on('finish', () => {
      this.duration = Date.now() - req.timestamp;
    });
  }

  /**
   * The response body
   *
   * @type {(Buffer|Record<string, unknown>|string)}
   */
  get body(): string | Buffer | Record<string, unknown> {
    return this.parseBody(Buffer.concat(this.#chunks));
  }

  /**
   * Sends a json response
   *
   * @param  {string|Record<string, unknown>}  json     The json
   * @param  {SendOptions}                 options  Reponse options
   *
   * @return {MoxyResponse}
   */
  sendJson(json: string | Record<string, unknown> | unknown[], options?: SendOptions): this {
    if (typeof json !== 'string') {
      let status: number | null = options?.status ?? null;
      if (!Array.isArray(json) && typeof json.status === 'number') {
        status ??= json.status;
      }
      options = { ...options, status: status ?? 200 };
      json = JSON.stringify(json);
    }

    this.setHeaders({ 'Content-Type': 'application/json', ...options?.headers });
    this.writeHead(options?.status ?? 200).end(json);

    return this;
  }

  /**
   * Sends a file
   *
   * @param  {string}       filename  The json
   * @param  {SendOptions}  options   Reponse options
   *
   * @return {MoxyResponse}
   */
  sendFile(filename: string, options?: SendOptions): this {
    let filePath = path.join(process.cwd(), filename.replace(/\.\.\/?/g, ''));

    if (!fs.existsSync(filePath)) {
      const trimmed = filePath.replace(/\?.*/, '');
      if (trimmed !== filePath && fs.existsSync(trimmed.replace(/\?.*/, ''))) {
        filePath = trimmed;
      } else {
        return this.sendJson({ status: 404, body: 'Not found' }, { status: 404 });
      }
    }

    const stat = fs.statSync(filePath);

    this.setHeaders({
      'Content-Type': this.getContentTypeFromFileExt(filePath),
      'Content-Length': stat.size,
      ...options?.headers,
    });

    this.writeHead(options?.status ?? 200);

    return fs.createReadStream(filePath).pipe(this);
  }

  /**
   * Gets the content type from file extention
   *
   * @param  {string}  filename  The filename
   *
   * @return {string}
   */
  getContentTypeFromFileExt(filename: string): string {
    const ext = path.extname(filename);

    return extToMimeType[ext] || `application/x-${ext.slice(1)}`;
  }

  /**
   * Set response headers
   * The writeHead method buffers headers, so they are not available for
   * logging without calling setHeaders
   *
   * @param {Record<string, string | readonly string[] | number>}  headers  The headers
   */
  setHeaders(
    headers:
      | Headers
      | Map<string, number | string | readonly string[]>
      | Record<string, string | readonly string[] | number>,
  ): this {
    for (const [name, value] of Object.entries(headers) as [string, number | string | readonly string[]][]) {
      this.setHeader(name, value);
    }

    return this;
  }

  /**
   * Parse the response body based on content-type
   *
   * @param  {Buffer}  body  The body
   *
   * @return {(Buffer|Record<string, unknown>|string)}
   */
  parseBody(body: Buffer): string | Buffer | Record<string, unknown> {
    const content = this.getHeader('Content-Type') as string;

    if (!content) {
      return body;
    }

    if (/text\//.test(content)) {
      return body.toString('utf8');
    }

    if (/application\/json/.test(content)) {
      return JSON.parse(body.toString('utf8')) as Record<string, unknown>;
    }

    return body;
  }

  /**
   * Override writablewrite to store body internally
   *
   * @param  {string}   chunk  The chunk
   * @param  {unknown[]}    args   The arguments
   *
   * @return {boolean}
   */
  write(chunk: string, ...args: unknown[]): boolean {
    const written = super.write(chunk, ...(args as []));
    this.#chunks.push(Buffer.from(chunk));

    return written;
  }

  /**
   * Overwrite writableend to store body internally
   *
   * @param {unknown[]}  args  The arguments
   */
  end(...args: unknown[]): this {
    super.end(...(args as []));

    if (args[0]) {
      this.#chunks.push(Buffer.from(args[0] as string));
    }

    return this;
  }
}
