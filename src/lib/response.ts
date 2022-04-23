import * as fs from 'fs';
import { OutgoingHttpHeaders, ServerResponse } from 'http';
import * as path from 'path';
import { MoxyRequest } from './request';

export interface SendOptions {
  headers?: OutgoingHttpHeaders;
  status?: number;
}

export class MoxyResponse extends ServerResponse {
  /**
   * Unique request UUID
   */
  id: string;
  /**
   * Request duration in ms
   */
  duration: number;

  #chunks: any[] = [];

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
   * @type {(Buffer|Record<string, any>|string)}
   */
  get body(): string | Buffer | Record<string, any> {
    return this.parseBody(Buffer.concat(this.#chunks));
  }

  /**
   * Sends a json response.
   *
   * @param  {string|Record<string, any>}  json     The json
   * @param  {SendOptions}                 options  Reponse options
   *
   * @return {MoxyResponse}
   */
  sendJson(json: string | Record<string, any>, options?: SendOptions): MoxyResponse {
    if (typeof json !== 'string') {
      options = { ...options, status: options?.status ?? json?.status };
      json = JSON.stringify(json);
    }

    this.setHeaders({ 'Content-Type': 'application/json', ...options?.headers });
    this.writeHead(options?.status ?? 200).end(json);

    return this;
  }

  /**
   * Sends a file.
   *
   * @param  {string}       filename  The json
   * @param  {SendOptions}  options   Reponse options
   *
   * @return {MoxyResponse}
   */
  sendFile(filename: string, options?: SendOptions): MoxyResponse {
    let filePath = path.join(process.cwd(), filename);

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
   * Gets the content type from file extention.
   *
   * @param  {string}  filename  The filename
   *
   * @return {string}
   */
  getContentTypeFromFileExt(filename: string): string {
    const mimes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.xml': 'text/xml',
      '.gif': 'image/gif',
      '.jpeg': 'image/jpeg',
      '.jpg': 'image/jpeg',
      '.js': 'application/x-javascript',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.ico': 'image/x-icon',
      '.bmp': 'image/x-ms-bmp',
    };

    return mimes[path.extname(filename)] || 'application/octet-stream';
  }

  /**
   * Set response headers.
   * The writeHead method buffers headers, so they are not available for
   * logging without calling setHeaders.
   *
   * @param {Record<string, string | readonly string[] | number>}  headers  The headers
   */
  setHeaders(headers: Record<string, string | number | readonly string[]>): void {
    for (const [name, value] of Object.entries(headers)) {
      this.setHeader(name, value);
    }
  }

  /**
   * Parse the response body based on content-type
   *
   * @param  {Buffer}  body  The body
   *
   * @return {(Buffer|Record<string, any>|string)}
   */
  parseBody(body: Buffer): string | Buffer | Record<string, any> {
    const content = this.getHeader('Content-Type') as string;

    if (!content) {
      return body;
    }

    if (/text\//.test(content)) {
      return body.toString('utf8');
    }

    if (/application\/json/.test(content)) {
      return JSON.parse(body.toString('utf8'));
    }
  }

  /**
   * Override writable.write to store body internally
   *
   * @param  {string}   chunk  The chunk
   * @param  {any[]}    args   The arguments
   *
   * @return {boolean}
   */
  write(chunk: string, ...args: any[]): boolean {
    const written = super.write(chunk, ...args);
    this.#chunks.push(Buffer.from(chunk));

    return written;
  }

  /**
   * Overwrite writable.end to store body internally
   *
   * @param {any[]}  args  The arguments
   */
  end(...args: any[]): void {
    super.end(...args);

    if (args[0]) {
      this.#chunks.push(Buffer.from(args[0]));
    }
  }
}
