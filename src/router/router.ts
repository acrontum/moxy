import * as fs from 'fs';
import { basename, join, posix } from 'path';
import { MoxyRequest, MoxyResponse } from '../server';
import { formatRoutesForPrinting, Logger } from '../util';
import { PathConfig, RouteConfig, RouterNet, Routes } from './index';

export interface RouterConfig {
  /**
   * If true, exposes CRUD routes for path config
   */
  allowHttpRouteConfig?: boolean;
}

export interface AddRouteOptions {
  /**
   * If true, route is deleted when used
   */
  once?: boolean;
  /**
   * If true, url is not parsed as regex
   */
  exact?: boolean;
}

export interface PathConfigWithOptions extends PathConfig {
  urlRegex?: RegExp;
}

export type ParsedPathConfig = RouteConfig & PathConfigWithOptions;

export class Router {
  /**
   * Entries of [router path, ParsedPathConfig]
   */
  routerPaths: [string, ParsedPathConfig][] = [];
  /**
   * Path-keyed router route config object
   */
  routes: Record<string, ParsedPathConfig> = {};
  /**
   * Entries of [router path, ParsedPathConfig] for single-use routes
   */
  onceRouterPaths: [string, ParsedPathConfig][] = [];
  /**
   * Router config options
   */
  options: RouterConfig;

  #routerNet: RouterNet;

  constructor(logger: Logger, options?: RouterConfig) {
    this.options = options || {};
    this.#routerNet = new RouterNet(this, logger);
  }

  /**
   * Adds a route
   *
   * @param  {string}           path     The path
   * @param  {RouteConfig}      config   The configuration
   * @param  {AddRouteOptions}  options  Options for the route
   *
   * @return {this}
   */
  addRoute(path: string, config: RouteConfig, options?: AddRouteOptions): this {
    if (!path) {
      throw new Error('router.on must contain "path"');
    }
    if (!config) {
      throw new Error('router.on must contain "config"');
    }

    const compiledRoute = this.#compileRoute(path, config, options);

    if (options?.once) {
      this.onceRouterPaths.push([path, compiledRoute]);

      delete compiledRoute.urlRegex;
      return this;
    }

    if (typeof config === 'function') {
      this.routes[path] = compiledRoute;
    } else {
      this.routes[path] = { ...(this.routes[path] || {}), ...compiledRoute };
      delete compiledRoute.urlRegex;
    }

    this.routerPaths = Object.entries(this.routes);

    return this;
  }

  /**
   * Adds many routes
   *
   * @param  {string}           prefix   The path prefix to prepend to all routes
   * @param  {Routes}           routes   Path suffix keyed RouteConfig
   * @param  {AddRouteOptions}  options  Options for the routes
   *
   * @return {this}
   */
  addRoutes(prefix: string, routes: Routes, options?: AddRouteOptions): this {
    Object.keys(routes).forEach((path) => this.addRoute(posix.join(prefix, path), routes[path], options));

    return this;
  }

  /**
   * Removes a route
   *
   * @param  {string}  path  The path
   *
   * @return {this}
   */
  removeRoute(path: string): this {
    delete this.routes[path];
    this.routerPaths = Object.entries(this.routes);

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

    this.routerPaths = Object.entries(this.routes);

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
      this.addRoutes(prefix, cfg);
    }
  }

  /**
   * Server request listener
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The resource
   *
   * @return {Promise<any>}
   */
  async requestListener(req: MoxyRequest, res: MoxyResponse): Promise<any> {
    return this.#routerNet.requestListener(req, res);
  }

  /**
   * Handle requests to api routes (/_moxy)
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The response
   *
   * @return {Promise<MoxyResponse>}
   */
  async handleApi(req: MoxyRequest, res: MoxyResponse): Promise<MoxyResponse> {
    const body = await req.getBody('json');
    const { path, config } = body;
    const configPath = req.path.replace(/^\/_moxy\/routes/, '');
    const apiRoute = `${req.method} ${req.path.replace(/\/*$/, '')}`;

    switch (apiRoute) {
      case 'GET /_moxy':
        return this.#sendApiRoot(res);

      case 'GET /_moxy/routes':
        return this.#sendApiRoutes(req, res);

      case 'GET /_moxy/router':
        return this.#sendApiRouter(req, res);
    }

    if (!this.options.allowHttpRouteConfig) {
      return res.sendJson({ message: 'Not found', status: 404 });
    }

    switch (apiRoute) {
      case 'POST /_moxy/routes':
        return this.#createApiRoute(req, res, path, config);

      case `PATCH /_moxy/routes${configPath}`:
        return this.#updateApiRoute(res, configPath, body);

      case `PUT /_moxy/routes${configPath}`:
        return this.#createOrReplaceApiRoute(res, configPath, body);

      case `DELETE /_moxy/routes${configPath}`:
        return this.#deleteApiRoute(res, configPath);
    }

    return res.sendJson({ message: 'Not found', status: 404 });
  }

  /**
   * Adds regex test to route config when options.exact is not true
   *
   * @param  {string}            fullPath  The full path
   * @param  {RouteConfig}       config    The configuration
   * @param  {AddRouteOptions}   options   Add route options
   *
   * @return {ParsedPathConfig}  The parsed path configuration
   */
  #compileRoute(fullPath: string, config: RouteConfig, options?: AddRouteOptions): ParsedPathConfig {
    if (typeof config === 'string' || typeof config === 'boolean') {
      return config;
    }

    const parsed = config as PathConfigWithOptions;

    if (!options?.exact && !(config as PathConfig)?.exact) {
      const pathWithGroups = this.#routerNet.parsePlaceholderParams(fullPath);
      parsed.urlRegex = new RegExp(`^${pathWithGroups}(\\?.*)?$`, 'g');
    }

    return parsed;
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
   * Sends an api root response
   *
   * @param  {MoxyResponse}  res  The response
   *
   * @return {MoxyResponse}
   */
  #sendApiRoot(res: MoxyResponse): MoxyResponse {
    if (!this.options.allowHttpRouteConfig) {
      return res.sendJson({
        'GET /routes?once=false': 'show router routes',
        'GET /router?once=false&serializeMethods=true': 'show router',
      });
    }

    return res.sendJson({
      'GET /routes?once=false': 'show router routes',
      'POST /routes?once=false': 'create route',
      'PUT /routes/:route': 'create or replace route',
      'PATCH /routes/:route': 'update route',
      'DELETE /routes/:route': 'delete route',
      'GET /router?once=false&serializeMethods=true': 'show router',
    });
  }

  /**
   * Sends api router keys
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The response
   *
   * @return {MoxyResponse}
   */
  #sendApiRoutes(req: MoxyRequest, res: MoxyResponse): MoxyResponse {
    return res.sendJson(
      Object.keys(req.query.once === 'true' ? Object.fromEntries(this.onceRouterPaths) : this.routes)
    );
  }

  /**
   * Sends the current router config
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The response
   *
   * @return {MoxyResponse}
   */
  #sendApiRouter(req: MoxyRequest, res: MoxyResponse): MoxyResponse {
    const routes = req.query.once === 'true' ? Object.fromEntries(this.onceRouterPaths) : this.routes;

    return res.sendJson(formatRoutesForPrinting(routes, req.query.serializeMethods !== 'false'));
  }

  /**
   * Creates a route config
   *
   * @param  {MoxyRequest}   req     The request
   * @param  {MoxyResponse}  res     The response
   * @param  {string}        path    The path
   * @param  {RouteConfig}   config  The configuration
   *
   * @return {MoxyResponse}
   */
  #createApiRoute(req: MoxyRequest, res: MoxyResponse, path: string, config: RouteConfig): MoxyResponse {
    this.addRoute(path, config, { once: req.query.once === 'true' });

    let payload = { [path]: this.routes[path] };
    if (req.query.once === 'true') {
      payload = Object.fromEntries([this.onceRouterPaths[this.onceRouterPaths.length - 1]]);
    }

    return res.sendJson(this.#removeRouteRegex(payload), { status: 201 });
  }

  /**
   * Updates an existing route config
   *
   * @param  {MoxyResponse}  res   The response
   * @param  {string}        path  The path
   * @param  {Json}          body  The body
   *
   * @return {MoxyResponse}
   */
  #updateApiRoute(res: MoxyResponse, path: string, body: Record<string, any>): MoxyResponse {
    if (!path || !this.routes[path]) {
      return res.sendJson({ message: 'Not found', status: 404 });
    }
    this.addRoute(path, body);

    return res.sendJson(this.#removeRouteRegex({ [path]: this.routes[path] }), { status: 200 });
  }

  /**
   * Creates or replaces a route config
   *
   * @param  {MoxyResponse}         res   The respoonse
   * @param  {string}               path  The path
   * @param  {Record<string, any>}  body  The body
   *
   * @return {MoxyResponse}
   */
  #createOrReplaceApiRoute(res: MoxyResponse, path: string, body: Record<string, any>): MoxyResponse {
    if (!path) {
      return res.sendJson({ message: 'Not found', status: 404 });
    }

    const status = this.routes[path] ? 200 : 201;

    delete this.routes[path];
    this.addRoute(path, body);

    return res.sendJson(this.#removeRouteRegex({ [path]: this.routes[path] }), { status });
  }

  /**
   * Removes a route config
   *
   * @param  {MoxyResponse}  res   The response
   * @param  {string}        path  The path
   *
   * @return {MoxyResponse}
   */
  #deleteApiRoute(res: MoxyResponse, path: string): MoxyResponse {
    delete this.routes[path];
    this.routerPaths = Object.entries(this.routes);

    return res.sendJson({ message: 'Ok' }, { status: 200 });
  }

  /**
   * Hides parsed regex from response
   *
   * @param  {Routes}  json  The json
   *
   * @return {string}
   */
  #removeRouteRegex(routes: Routes): string {
    return JSON.stringify(routes, (key, value) => {
      if (key !== 'urlRegex') {
        return value;
      }
    });
  }
}
