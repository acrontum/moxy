import { randomUUID } from 'crypto';
import { createServer, IncomingMessage, Server, ServerOptions, ServerResponse } from 'http';
import { AddressInfo, Socket } from 'net';
import { RouteConfig, Routes } from '../routes';
import { Logger, LogLevels, MoxyRequest, MoxyResponse, Router, RouterConfig, RouterNet } from './index';

export interface ServerConfig {
  /**
   * Set log level.
   */
  logging?: LogLevels;
  /**
   * Configuration passed to router.
   */
  router?: RouterConfig;
}

export interface CloseServerOptions {
  /**
   * If true, will force close all sockets.
   */
  closeConnections?: boolean;
}

export class MoxyServer {
  /**
   * Instance of HTTP server.
   */
  server?: Server;
  /**
   * The internal router.
   */
  router: Router;

  #routerNet: RouterNet;
  #currentResponse: MoxyResponse;

  constructor(config?: ServerConfig) {
    this.setLogging(process.env.MOXY_LOG || config?.logging || 'verbose');
    this.router = new Router(config?.router);
    this.#routerNet = new RouterNet(this.router);
  }

  /**
   * The listening server port.
   *
   * @type {number}
   */
  get port(): number {
    return (this?.server?.address?.() as AddressInfo)?.port;
  }

  /**
   * Sets the log verbosity.
   *
   * @param {string}  value  Log level
   */
  setLogging(value: string): void {
    process.env.MOXY_LOG = value;
  }

  /**
   * Add path config handler.
   *
   * @param  {string}       path    The path
   * @param  {RouteConfig}  config  The configuration
   *
   * @return {this}
   */
  on(path: string, config: RouteConfig | Routes): this {
    this.router.addRoute(path, config);

    return this;
  }

  /**
   * Remove path handler.
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
   * Add path handler which removes its self after the first response.
   *
   * @param  {string}       path    The path
   * @param  {RouteConfig}  config  The configuration
   *
   * @return {this}
   */
  once(path: string, config: RouteConfig | Routes): this {
    this.router.addRoute(path, config, true);

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
   * Start the HTTP server
   *
   * @param  {number}           [port=0]  The port. If none spcified, will use a random port
   *
   * @return {Promise<Server>}
   */
  async listen(port = 0): Promise<Server> {
    if (this.server) {
      Logger.warn('WARN: Server already running');

      return this.server;
    }

    const options: ServerOptions = { IncomingMessage: MoxyRequest, ServerResponse: MoxyResponse };

    this.server = createServer(options, (req: IncomingMessage, res: ServerResponse): Promise<void> => {
      this.#currentResponse = res as MoxyResponse;

      return this.#routerNet
        .requestListener(req as MoxyRequest, res as MoxyResponse)
        .catch((error) => this.#handleUncaughtErrors(error));
    });

    this.#createConnectionManager();

    return new Promise<Server>((resolve, reject) => {
      this.server.on('error', reject);

      this.server.listen(port, () => {
        Logger.log(`moxy up :${this.port}`);

        return resolve(this.server);
      });
    });
  }

  /**
   * Close the HTTP server.
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
   * { function_description }
   *
   * @param {Error}  error  The error
   */
  #handleUncaughtErrors(error: Error): void {
    Logger.error(error);

    if (this.#currentResponse && !this.#currentResponse.writableEnded) {
      this.#currentResponse.sendJson({ status: 500, error: JSON.stringify(error, Object.getOwnPropertyNames(error)) });
      this.#currentResponse = null;
    }
  }

  /**
   * Creates a connection manager.
   */
  #createConnectionManager(): void {
    const connections: Record<string, Socket> = {};

    this.server.on('connection', (socket) => {
      const id = randomUUID();
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
