import * as fs from 'fs';
import { basename, join, posix } from 'path';
import { RouteConfig, Routes } from '../routes';
import { formatRoutesForPrinting } from './format';
import { MoxyRequest } from './request';
import { MoxyResponse } from './response';

export interface RouterConfig {
  /**
   * If true, exposes CRUD routes for path config.
   */
  allowHttpRouteConfig?: boolean;
}

export class Router {
  /**
   * Entries of [router path, RouteConfig].
   */
  routerPaths: [string, RouteConfig][] = [];
  /**
   * Path-keyed router route config object.
   */
  routes: Routes = {};
  /**
   * Entries of [router path, RouteConfig] for single-use routes.
   */
  onceRouterPaths: [string, RouteConfig][] = [];
  /**
   * Router config options.
   */
  options: RouterConfig;

  constructor(options?: RouterConfig) {
    this.options = options || {};
  }

  /**
   * Adds a route.
   *
   * @param  {string}       path          The path
   * @param  {RouteConfig}  config        The configuration
   * @param  {boolean}      [once=false]  If true, route fires once only.
   *
   * @return {this}
   */
  addRoute(path: string, config: RouteConfig | Routes, once = false): this {
    config = this.#convertRouteConfigToRoutes(path, config);

    for (const [nestedPath, cfg] of Object.entries(config)) {
      const fullPath = posix.join(path, nestedPath);
      if (once) {
        this.onceRouterPaths.push([fullPath, cfg]);

        return this;
      }

      if (typeof cfg === 'function') {
        this.routes[fullPath] = cfg;
      } else {
        this.routes[fullPath] = { ...(this.routes[fullPath] || {}), ...cfg };
      }
    }

    this.routerPaths = Object.entries(this.routes);

    return this;
  }

  /**
   * Removes a route.
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
   * Recursively search the folder at <path> for files matching <anything>.routes.js(on) and import their config.
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
   * Gets the folder contents.
   *
   * @param  {string}                dirPath  The dir path
   *
   * @return {Promise<fs.Dirent[]>}
   */
  async getFolderContents(dirPath: string): Promise<fs.Dirent[]> {
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });

    return files.map((file) => {
      file.name = join(dirPath, file.name);

      return file;
    });
  }

  /**
   * Loads a configuration from file.
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
      this.addRoute(prefix, cfg);
    }
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
   * Converts Routes to RouteConfig.
   *
   * @param  {string}                path    The base path
   * @param  {(RouteConfig|Routes)}  config  The routing config
   *
   * @return {RouteConfig}
   */
  #convertRouteConfigToRoutes(path: string, config: RouteConfig | Routes): Routes {
    if (typeof config !== 'object' || !config) {
      return { [path]: config };
    }

    if ('status' in config || 'body' in config || 'headers' in config || 'handler' in config) {
      return { [path]: config };
    }

    for (const method of ['connect', 'delete', 'get', 'head', 'options', 'patch', 'post', 'put', 'trace']) {
      if (method in config) {
        return { '': config };
      }
    }

    return config as Routes;
  }

  /**
   * Determines whether the specified path is router file.
   *
   * @param  {string}   path  The path
   *
   * @return {boolean}
   */
  #isRouterFile(path: string): boolean {
    return /\.routes\.js(on)?$/.test(path);
  }

  /**
   * Sends an api root response.
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
      'PUT /routes/:route': 'create or update route',
      'PATCH /routes/:route': 'update route',
      'DELETE /routes/:route': 'delete route',
      'GET /router?once=false&serializeMethods=true': 'show router',
    });
  }

  /**
   * Sends api router keys.
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
   * Sends the current router config.
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
   * Creates a route config.
   *
   * @param  {MoxyRequest}   req     The request
   * @param  {MoxyResponse}  res     The response
   * @param  {string}        path    The path
   * @param  {RouteConfig}   config  The configuration
   *
   * @return {MoxyResponse}
   */
  #createApiRoute(req: MoxyRequest, res: MoxyResponse, path: string, config: RouteConfig): MoxyResponse {
    this.addRoute(path, config, req.query.once === 'true');

    let payload = { [path]: this.routes[path] };
    if (req.query.once === 'true') {
      payload = Object.fromEntries([this.onceRouterPaths[this.onceRouterPaths.length - 1]]);
    }

    return res.sendJson(payload, { status: 200 });
  }

  /**
   * Updates an existing route config.
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

    return res.sendJson({ [path]: this.routes[path] }, { status: 200 });
  }

  /**
   * Creates or replaces a route config.
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

    delete this.routes[path];
    this.addRoute(path, body);

    return res.sendJson({ [path]: this.routes[path] }, { status: 200 });
  }

  /**
   * Removes a route config.
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
}
