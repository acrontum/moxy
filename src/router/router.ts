import * as http from 'http';
import * as https from 'https';
import { posix } from 'path';
import { URL } from 'url';
import { MoxyRequest, MoxyResponse, MoxyServer } from '../server';
import { HttpException, Logger, formatRouteResponse, formatRoutesForPrinting } from '../util';
import {
  HandlerVariables,
  Method,
  MethodConfig,
  MethodSettings,
  PathConfig,
  PathSettings,
  RouteConfig,
  Routes,
} from './index';

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
  #logger: Logger;
  #server: MoxyServer;

  constructor(logger: Logger, server: MoxyServer, options?: RouterConfig) {
    this.options = options || {};
    this.#logger = logger;
    this.#server = server;
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
      throw new HttpException('router.on must contain "path"', 422);
    }
    if (!config) {
      throw new HttpException('router.on must contain "config"', 422);
    }

    const compiledRoute = this.#compileRoute(path, config, options);

    if (options?.once) {
      this.onceRouterPaths.push([path, compiledRoute]);

      delete compiledRoute.urlRegex;
      return this;
    }

    if (typeof config === 'function') {
      this.routes[path] = compiledRoute;
    } else if (typeof config === 'string') {
      this.routes[path] = { ...(compiledRoute as PathConfig) };
      delete compiledRoute.urlRegex;
    } else {
      this.routes[path] = { ...((this.routes[path] as PathConfig) || {}), ...(compiledRoute as PathConfig) };
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
   * Creates a simple opaque proxy
   *
   * @param {httpIncomingMessage}  request   The request
   * @param {httpServerResponse}   response  The response
   * @param {string}               proxyUrl  The proxy url
   * @param {httpsRequestOptions}  options   The request options
   */
  createProxy(
    request: http.IncomingMessage,
    response: MoxyResponse,
    proxyUrl: string,
    options?: https.RequestOptions
  ): void {
    const target = new URL(proxyUrl);

    const reqOptions: https.RequestOptions = {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: target.pathname,
      method: request.method,
      ...options,
      headers: { ...request?.headers, ...options?.headers, Host: target.hostname },
    };

    const protocol = reqOptions.protocol === 'http:' ? http : https;

    const proxy = protocol.request(reqOptions, (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode, proxyResponse.headers);
      proxyResponse.pipe(response, { end: true });
    });

    proxy.on('error', (error) => {
      if (!response.writableEnded) {
        response.sendJson({ status: 502, message: error }, { headers: { 'X-Moxy-Error': 'proxy error' } });
      }
    });
    request.on('error', (error) => {
      if (!response.writableEnded) {
        response.sendJson({ status: 500, message: error }, { headers: { 'X-Moxy-Error': 'request error' } });
      }
    });
    proxy.on('timeout', () => {
      response.sendJson(
        { status: 504, message: 'Proxy timeout', options: reqOptions },
        { headers: { 'X-Moxy-Error': 'proxy timeout' } }
      );
      request.destroy();
      proxy.destroy();
    });

    request.pipe(proxy, { end: true });
  }

  /**
   * Server request listener
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The resource
   *
   * @return {Promise<any>}
   */
  async requestListener(req: MoxyRequest, res: MoxyResponse): Promise<void | MoxyResponse> {
    res.on('finish', () => this.#logger.log(`\n${formatRouteResponse(req, res)}`));

    if (/^\/_moxy/.test(req.url)) {
      return await this.handleApi(req, res);
    }

    for (const index in this.onceRouterPaths) {
      const [url, routeConfig] = this.onceRouterPaths[index];

      const response = await this.tryHandleRequest(req, res, url, routeConfig);
      if (response !== null) {
        this.onceRouterPaths.splice(parseInt(index, 10), 1);

        return response;
      }
    }

    if (req.url in this.routes) {
      const response = await this.tryHandleRequest(req, res, req.url, this.routes[req.url]);
      if (response !== null) {
        return response;
      }
    }

    if (req.path in this.routes) {
      const response = await this.tryHandleRequest(req, res, req.path, this.routes[req.path]);
      if (response !== null) {
        return response;
      }
    }

    for (const [url, routeConfig] of this.routerPaths) {
      const response = await this.tryHandleRequest(req, res, url, routeConfig);
      if (response !== null) {
        return response;
      }
    }

    return res.sendJson({ message: 'Not found', status: 404 }, { headers: { 'X-Moxy-Error': 'Route not found' } });
  }

  /**
   * Handles server request based on path config
   *
   * @param  {MoxyRequest}   req          The request
   * @param  {MoxyResponse}  res          The resource
   * @param  {string}        url          The url to test
   * @param  {RouteConfig}   routeConfig  The parsed route config
   *
   * @return {Promise<null|void|MoxyResponse>}
   */
  async tryHandleRequest(
    req: MoxyRequest,
    res: MoxyResponse,
    url: string,
    routeConfig: ParsedPathConfig
  ): Promise<null | void | MoxyResponse> {
    const { methodConfig, proxySettings } = this.#parseRequestConfig(req, routeConfig);
    let variables = req.query;

    if (typeof methodConfig === 'undefined' && !proxySettings && typeof routeConfig !== 'function') {
      return null;
    }

    if (routeConfig.urlRegex) {
      const match: RegExpExecArray = routeConfig.urlRegex.exec(req.url);
      routeConfig.urlRegex.lastIndex = 0;

      if (!match) {
        return null;
      }

      variables = { ...match?.groups, ...req.query };
    } else if (url !== req.url && url !== req.path) {
      return null;
    }

    await this.#delay(routeConfig?.delay);

    if (typeof routeConfig === 'function') {
      return routeConfig(req, res, variables, this.#server);
    }

    if (typeof methodConfig === 'function') {
      return methodConfig(req, res, variables, this.#server);
    }

    if (typeof methodConfig === 'string') {
      return res.sendFile(this.#applyReplacements(methodConfig, variables));
    }

    if (proxySettings) {
      await this.#delay(proxySettings.delay);

      return this.createProxy(
        req,
        res,
        this.#applyReplacements(proxySettings.proxy, variables),
        proxySettings.proxyOptions
      );
    }

    await this.#delay(methodConfig?.delay);

    return await this.#parseConfigRoute(res, methodConfig, variables);
  }

  /**
   * Convert simple replacement params into regex match groups
   *
   * @param  {string}  url  The url
   *
   * @return {string}
   */
  parsePlaceholderParams(url: string): string {
    if (url.charAt(0) !== '/') {
      url = `/${url}`;
    }

    return url.replace(/:([a-zA-Z][a-zA-Z0-9]+)/g, (_, varname) => `(?<${varname}>[^/#?]+)`);
  }

  /**
   * Extract configurations from incoming request
   *
   * @param {MoxyRequest}       req          The request
   * @param {ParsedPathConfig}  routeConfig  The route configuration
   *
   * @return { methodConfig: MethodConfig; proxySettings: PathSettings }
   */
  #parseRequestConfig(
    req: MoxyRequest,
    routeConfig: ParsedPathConfig
  ): { methodConfig: MethodConfig; proxySettings: PathSettings } {
    const method = req.method?.toLowerCase?.() as Method;
    const methodConfig =
      (routeConfig as PathConfigWithOptions)?.[method] || (routeConfig as PathConfigWithOptions)?.all;

    let proxySettings: PathSettings = null;

    if ((methodConfig as MethodSettings)?.proxy) {
      proxySettings = methodConfig as MethodSettings;
    } else if ((routeConfig as MethodSettings)?.proxy) {
      proxySettings = routeConfig as MethodSettings;
    }

    return { methodConfig, proxySettings };
  }

  /**
   * Parse and response to configured route
   *
   * @param {MoxyResponse}      res           The response
   * @param {MethodSettings}    methodConfig  Route configuration
   * @param {HandlerVariables}  variables     Replacements, including match groups and query params
   *
   * @return {Promise<null | void | MoxyResponse>}
   */
  async #parseConfigRoute(
    res: MoxyResponse,
    methodConfig: MethodSettings,
    variables: HandlerVariables
  ): Promise<null | void | MoxyResponse> {
    const status = methodConfig.status ?? 200;
    const headers: http.OutgoingHttpHeaders = methodConfig?.headers;

    let body = methodConfig.body;
    if (typeof body === 'object' && body !== null) {
      try {
        body = JSON.stringify(body);
        res.setHeader('Content-Type', 'application/json');
      } catch (e) {}
    }
    body = this.#applyReplacements(body, variables);

    return res.writeHead(status, headers).end(body);
  }

  async #delay(delay: number): Promise<void> {
    if (!delay) {
      return;
    }
    const ms = parseInt(`${delay}`, 10);
    if (Number.isNaN(ms) || ms <= 0) {
      return;
    }
    await new Promise((res) => setTimeout(res, ms));
  }

  /**
   * Replace params in payload with those from url placeholders
   *
   * @param  {string}            payload    The payload
   * @param  {HandlerVariables}  variables  Replacements, including match groups and query params
   *
   * @return {string}
   */
  #applyReplacements(payload: string, variables: HandlerVariables): string {
    if (!payload || typeof payload !== 'string') {
      return payload;
    }

    const serialize = (value: string | string[]): string => (Array.isArray(value) ? JSON.stringify(value) : value);

    Object.entries(variables || {}).forEach(([varname, replacement]) => {
      payload = payload.replace(new RegExp(`:${varname}`, 'g'), serialize(replacement));
    });

    return payload;
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
    if (typeof config === 'boolean') {
      return config;
    }

    let parsed = config as PathConfigWithOptions;
    if (typeof config === 'string') {
      parsed = { get: config };
    }

    if (!options?.exact && !(config as PathConfig)?.exact) {
      const pathWithGroups = this.parsePlaceholderParams(fullPath);
      parsed.urlRegex = new RegExp(`^${pathWithGroups}(\\?.*)?$`, 'g');
    }

    return parsed;
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
