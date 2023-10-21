import * as fs from 'fs';
import { createServer, IncomingMessage, Server, ServerOptions, ServerResponse } from 'http';
import { AddressInfo, Socket } from 'net';
import { basename, join } from 'path';
import { AddRouteOptions, RouteConfig, Router, RouterConfig, Routes } from '../router';
import { getId, HttpException, Logger, LogLevels } from '../util';
import { MoxyRequest } from './request';
import { MoxyResponse } from './response';

export interface ServerConfig {
  /**
   * Set log level
   */
  logging?: LogLevels;
  /**
   * Configuration passed to router
   */
  router?: RouterConfig;
}

export interface CloseServerOptions {
  /**
   * If true, will force close all sockets
   */
  closeConnections?: boolean;
}

export class MoxyServer {
  /**
   * Instance of HTTP server
   */
  server?: Server;
  /**
   * The internal router
   */
  router: Router;

  #responses: Record<string, MoxyResponse>;
  #logger: Logger;

  constructor(config?: ServerConfig) {
    this.#logger = new Logger(process.env.MOXY_LOG || config?.logging || 'verbose');
    this.router = new Router(this.#logger, config?.router);
    this.#responses = {};
  }

  /**
   * The listening server port
   *
   * @type {number}
   */
  get port(): number {
    return (this?.server?.address?.() as AddressInfo)?.port;
  }

  /**
   * Get current log level
   */
  get logLevel(): string {
    return this.#logger.level;
  }

  /**
   * Set current log level
   */
  set logLevel(value: string) {
    this.#logger.level = value;
  }

  /**
   * Add path config handler
   *
   * @param  {string}                path     The path
   * @param  {RouteConfig}           config   The route handler config
   * @param  {AddRouteOptions}       options  Extra router options
   *
   * @return {this}
   */
  on(path: string, config: RouteConfig, options?: AddRouteOptions): this {
    this.router.addRoute(path, config, options);

    return this;
  }

  /**
   * Same as calling @MoxyServer.on over Object.entries with a prefx
   *
   * @param  {string}           prefix   The path prefix to prepend to all routes
   * @param  {Routes}           routes   Path suffix keyed RouteConfig
   * @param  {AddRouteOptions}  options  Extra router options
   *
   * @return {this}
   */
  onAll(prefix: string, routes: Routes, options?: AddRouteOptions): this {
    this.router.addRoutes(prefix, routes, options);

    return this;
  }

  /**
   * Remove path handler
   *
   * @param  {string}  path  The path
   *
   * @return {this}
   */
  off(path: string): this {
    this.router.removeRoute(path);

    return this;
  }

  /**
   * Add path handler which removes its self after the first response
   *
   * @param  {string}                path     The path
   * @param  {(RouteConfig|Routes)}  config   The configuration
   * @param  {AddRouteOptions}       options  Extra router options
   *
   * @return {this}
   */
  once(path: string, config: RouteConfig | Routes, options?: AddRouteOptions): this {
    this.router.addRoute(path, config, { ...options, once: true });

    return this;
  }

  /**
   * Clear all routing config
   *
   * @return {this}
   */
  resetRoutes(): this {
    this.router.routes = {};
    this.router.routerPaths = [];
    this.router.onceRouterPaths = [];

    return this;
  }

  /**
   * Recursively search the folder at <path> for files matching <anything>.routes.js(on) and import their config
   *
   * @param  {string}  [path]  The path
   *
   * @return {this}
   */
  async addRoutesFromFolder(path: string): Promise<this> {
    const files = await this.getFolderContents(path);

    while (files.length) {
      const next = files.shift();

      if (next.isDirectory()) {
        files.push(...(await this.getFolderContents(next.name)));
        continue;
      }

      if (this.#isRouterFile(next.name)) {
        this.loadConfigFromFile(next.name, path);
      }
    }

    this.router.routerPaths = Object.entries(this.router.routes);

    return this;
  }

  /**
   * Gets the folder contents
   *
   * @param  {string}                dirPath  The dir path
   *
   * @return {Promise<fsDirent[]>
   */
  async getFolderContents(dirPath: string): Promise<fs.Dirent[]> {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

    return files.map((file) => {
      file.name = join(dirPath, file.name);

      return file;
    });
  }

  /**
   * Loads a configuration from file
   *
   * @param {string}  filePath  The file path
   * @param {string}  basePath  The base path
   */
  loadConfigFromFile(filePath: string, basePath: string): void {
    let pathConfig: Record<string, Routes> = require(filePath); // eslint-disable-line @typescript-eslint/no-var-requires
    const prefix = filePath.replace(`/${basename(filePath)}`, '').replace(basePath, '');

    if (filePath.endsWith('.json')) {
      pathConfig = { export: pathConfig };
    }

    for (const cfg of Object.values(pathConfig)) {
      this.router.addRoutes(prefix, cfg);
    }
  }

  /**
   * Start the HTTP server
   *
   * @param  {number}  [port=0]  The port. If none spcified, will use a random port
   *
   * @return {Promise<Server>}
   */
  async listen(port = 0): Promise<Server> {
    if (this.server) {
      this.#logger.warn('WARN: Server already running');

      return this.server;
    }

    const options: ServerOptions = { IncomingMessage: MoxyRequest, ServerResponse: MoxyResponse };

    this.server = createServer(
      options,
      async (req: IncomingMessage, res: ServerResponse): Promise<void | MoxyResponse> => {
        this.#responses[(req as MoxyRequest).id] = res as MoxyResponse;

        try {
          const response = await this.router.requestListener(req as MoxyRequest, res as MoxyResponse);
          delete this.#responses[(req as MoxyRequest).id];

          return response;
        } catch (error) {
          this.#handleUncaughtErrors(error as HttpException, res as MoxyResponse);
        }
      }
    );

    this.#createConnectionManager();

    return new Promise<Server>((resolve, reject) => {
      this.server.on('error', reject);

      this.server.listen(port, () => {
        this.#logger.log(`moxy up :${this.port}`);

        return resolve(this.server);
      });
    });
  }

  /**
   * Close the HTTP server
   *
   * @param  {CloseServerOptions}  options  Close server options
   *
   * @return {Promise<void>}
   */
  close(options?: CloseServerOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
      }

      if (options?.closeConnections) {
        this.server.emit('closeConnections');
      }

      this.server.close((error) => (error ? reject(error) : resolve((this.server = null))));
    });
  }

  /**
   * Determines whether the specified path is router file
   *
   * @param  {string}   path  The path
   *
   * @return {boolean}
   */
  #isRouterFile(path: string): boolean {
    return /\.routes\.js(on)?$/.test(path);
  }

  /**
   * Configures logging errors and returning 500
   *
   * @param {Error}  error  The error
   */
  #handleUncaughtErrors(error: HttpException, res: MoxyResponse): void {
    this.#logger.error(error);

    const currentResponse = this.#responses[res.id];

    if (currentResponse && !currentResponse.writableEnded) {
      if (error?.status) {
        currentResponse.sendJson({ status: error.status, error: error.message });
      } else {
        currentResponse.sendJson({
          status: 500,
          error: JSON.stringify(error, Object.getOwnPropertyNames(error)),
        });
      }
    }

    delete this.#responses[res.id];
  }

  /**
   * Configures connection management
   */
  #createConnectionManager(): void {
    const connections: Record<string, Socket> = {};

    this.server.on('connection', (socket) => {
      const id = getId();
      connections[id] = socket;

      socket.on('close', () => {
        delete connections[id];
      });
    });

    this.server.on('closeConnections', () => {
      for (const id in connections) {
        connections[id].destroy();
      }
    });
  }
}
