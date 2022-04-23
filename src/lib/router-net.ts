import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import { Method, PathConfig, ProxySettings, Route, RouteConfig } from '../routes';
import { formatRouteResponse } from './format';
import { MoxyRequest, MoxyResponse, Router } from './index';
import { Logger } from './logger';

export class RouterNet {
  #router: Router;

  constructor(router: Router) {
    this.#router = router;
  }

  /**
   * Creates a simple opaque proxy.
   *
   * @param {http.IncomingMessage}  request   The request
   * @param {http.ServerResponse}   response  The response
   * @param {string}                proxyUrl  The proxy url
   * @param {https.RequestOptions}  options   The request options
   */
  createProxy(
    request: http.IncomingMessage,
    response: http.ServerResponse,
    proxyUrl: string,
    options?: https.RequestOptions
  ): void {
    const target = new URL(proxyUrl);

    const reqOptions: https.RequestOptions = {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      path: target.href.replace(`${target.protocol}//${target.hostname}:${target.port}`, ''),
      method: request.method,
      ...options,
      headers: { ...request?.headers, ...options?.headers, Host: target.hostname },
    };

    const protocol = reqOptions.protocol === 'http:' ? http : https;

    const proxy = protocol.request(reqOptions, (res) => {
      response.writeHead(res.statusCode, res.headers);
      res.pipe(response, { end: true });
    });

    request.pipe(proxy, { end: true });
  }

  /**
   * Server request listener.
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The resource
   *
   * @return {Promise<any>}
   */
  async requestListener(req: MoxyRequest, res: MoxyResponse): Promise<any> {
    res.on('finish', () => Logger.log(`\n${formatRouteResponse(req, res)}`));

    if (/^\/_moxy/.test(req.url)) {
      return await this.#router.handleApi(req, res);
    }

    for (const index in this.#router.onceRouterPaths) {
      const [path, data] = this.#router.onceRouterPaths[index];

      const response = await this.tryHandleRequest(req, res, path, data);
      if (response !== null) {
        this.#router.onceRouterPaths.splice(parseInt(index, 10), 1);

        return response;
      }
    }

    if (req.path in this.#router.routes) {
      const response = await this.tryHandleRequest(req, res, req.path, this.#router.routes[req.path]);
      if (response !== null) {
        return response;
      }
    }

    for (const [path, data] of this.#router.routerPaths) {
      const response = await this.tryHandleRequest(req, res, path, data);
      if (response !== null) {
        return response;
      }
    }

    return res.sendJson({ message: 'Not found', status: 404 });
  }

  /**
   * Handles server request based on path config.
   *
   * @param  {MoxyRequest}                        req   The request
   * @param  {MoxyResponse}                       res   The resource
   * @param  {string}                             path  The path
   * @param  {RouteConfig}                        data  The data
   *
   * @return {(MoxyResponse>|Promise<null|void)}  { description_of_the_return_value }
   */
  async tryHandleRequest(
    req: MoxyRequest,
    res: MoxyResponse,
    path: string,
    routeConfig: RouteConfig
  ): Promise<null | void | MoxyResponse> {
    const method = req.method?.toLowerCase?.() as Method;
    const config = (routeConfig as PathConfig)?.[method];

    let proxySettings: ProxySettings = null;

    if ((config as Route)?.proxy) {
      proxySettings = config as Route;
    } else if ((routeConfig as Route)?.proxy) {
      proxySettings = routeConfig as Route;
    }

    if (typeof config === 'undefined' && !proxySettings && typeof routeConfig !== 'function') {
      return null;
    }

    const formattedPath = this.#parsePlaceholderParams(path);
    const regex = new RegExp(`^${formattedPath}(\\?.*)?$`, 'g');
    const match: RegExpExecArray = regex.exec(req.url);
    const variables = { ...match?.groups, ...req.query };

    if (!match) {
      return null;
    }

    if (typeof config === 'string') {
      return res.sendFile(this.#applyReplacements(config, variables));
    }

    if (typeof routeConfig === 'function') {
      return routeConfig(req, res, variables);
    }

    if (typeof config === 'function') {
      return config(req, res, variables);
    }

    if (proxySettings) {
      return this.createProxy(
        req,
        res,
        this.#applyReplacements(proxySettings.proxy, variables),
        proxySettings.proxyOptions
      );
    }

    return await this.#parseConfigRoute(res, config, routeConfig, variables);
  }

  /**
   * Parse and response to configured route
   *
   * @param {MoxyResponse}                       res         The response
   * @param {Route}                              route       Route configuration
   * @param {PathConfig}                         pathConfig  Path configuration
   * @param {Record<string, string | string[]>}  variables   Replacements, including match groups and query params
   *
   * @return {Promise<null | void | MoxyResponse>}
   */
  async #parseConfigRoute(
    res: MoxyResponse,
    route: Route,
    pathConfig: PathConfig,
    variables: Record<string, string | string[]>
  ): Promise<null | void | MoxyResponse> {
    const status = route.status ?? 200;
    const headers: http.OutgoingHttpHeaders = route?.headers;

    if (pathConfig.delay ?? route?.delay) {
      const ms = parseInt(`${pathConfig.delay ?? route?.delay}`, 10);
      if (!Number.isNaN(ms) && ms > 0) {
        await new Promise((res) => setTimeout(res, ms));
      }
    }

    let body = route.body;
    if (typeof body === 'object' && body !== null) {
      try {
        body = JSON.stringify(body);
        res.setHeader('Content-Type', 'application/json');
      } catch (e) {}
    }
    body = this.#applyReplacements(body, variables);

    return res.writeHead(status, headers).end(body);
  }

  /**
   * Convert colon params into regex match groups
   *
   * @param  {string}  url  The url
   *
   * @return {string}
   */
  #parsePlaceholderParams(url: string): string {
    if (url.charAt(0) !== '/') {
      url = `/${url}`;
    }

    return url.replace(/(^|[/?#=]):([^/?#=]+)($|[/?#=])/g, (_, leader, varname, trailer) => {
      return `${leader.replace('?', '\\?')}(?<${varname}>[^/#?]+)${trailer.replace('?', '\\?')}`;
    });
  }

  /**
   * Replace params in payload with those from url placeholders
   *
   * @param  {string}        target     The target
   * @param  {Recordstring}  variables  The variables
   * @param  {<type>}        string     The string
   *
   * @return {string}
   */
  #applyReplacements(target: string, variables: Record<string, string | string[]>): string {
    const serialize = (value: string | string[]): string => (Array.isArray(value) ? JSON.stringify(value) : value);

    Object.entries(variables || {}).forEach(([varname, replacement]) => {
      target = target.replace(new RegExp(`:${varname}`, 'g'), serialize(replacement));
    });

    return target;
  }
}
