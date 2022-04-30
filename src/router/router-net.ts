import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import {
  formatRouteResponse,
  HandlerVariables,
  Logger,
  Method,
  MethodSettings,
  MoxyRequest,
  MoxyResponse,
  ParsedPathConfig,
  PathConfig,
  PathConfigWithOptions,
  PathSettings,
  Router,
} from '..';

export class RouterNet {
  #router: Router;
  #logger: Logger;

  constructor(router: Router, logger: Logger) {
    this.#logger = logger;
    this.#router = router;
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
   * Server request listener
   *
   * @param  {MoxyRequest}   req  The request
   * @param  {MoxyResponse}  res  The resource
   *
   * @return {Promise<any>}
   */
  async requestListener(req: MoxyRequest, res: MoxyResponse): Promise<any> {
    res.on('finish', () => this.#logger.log(`\n${formatRouteResponse(req, res)}`));

    if (/^\/_moxy/.test(req.url)) {
      return await this.#router.handleApi(req, res);
    }

    for (const index in this.#router.onceRouterPaths) {
      const [url, routeConfig] = this.#router.onceRouterPaths[index];

      const response = await this.tryHandleRequest(req, res, url, routeConfig);
      if (response !== null) {
        this.#router.onceRouterPaths.splice(parseInt(index, 10), 1);

        return response;
      }
    }

    if (req.url in this.#router.routes) {
      const response = await this.tryHandleRequest(req, res, req.url, this.#router.routes[req.url]);
      if (response !== null) {
        return response;
      }
    }

    if (req.path in this.#router.routes) {
      const response = await this.tryHandleRequest(req, res, req.path, this.#router.routes[req.path]);
      if (response !== null) {
        return response;
      }
    }

    for (const [url, routeConfig] of this.#router.routerPaths) {
      const response = await this.tryHandleRequest(req, res, url, routeConfig);
      if (response !== null) {
        return response;
      }
    }

    return res.sendJson({ message: 'Not found', status: 404 });
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
    const method = req.method?.toLowerCase?.() as Method;
    const methodConfig =
      (routeConfig as PathConfigWithOptions)?.[method] || (routeConfig as PathConfigWithOptions)?.all;

    let variables = req.query;
    let proxySettings: PathSettings = null;

    if ((methodConfig as MethodSettings)?.proxy) {
      proxySettings = methodConfig as MethodSettings;
    } else if ((routeConfig as MethodSettings)?.proxy) {
      proxySettings = routeConfig as MethodSettings;
    }

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

    if (typeof routeConfig === 'function') {
      return routeConfig(req, res, variables);
    }

    if (typeof methodConfig === 'function') {
      return methodConfig(req, res, variables);
    }

    if (typeof methodConfig === 'string') {
      return res.sendFile(this.#applyReplacements(methodConfig, variables));
    }

    if (proxySettings) {
      return this.createProxy(
        req,
        res,
        this.#applyReplacements(proxySettings.proxy, variables),
        proxySettings.proxyOptions
      );
    }

    return await this.#parseConfigRoute(res, methodConfig, routeConfig, variables);
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
   * Parse and response to configured route
   *
   * @param {MoxyResponse}      res         The response
   * @param {MethodSettings}    route       Route configuration
   * @param {PathConfig}        pathConfig  Path configuration
   * @param {HandlerVariables}  variables   Replacements, including match groups and query params
   *
   * @return {Promise<null | void | MoxyResponse>}
   */
  async #parseConfigRoute(
    res: MoxyResponse,
    route: MethodSettings,
    pathConfig: PathConfig,
    variables: HandlerVariables
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
   * Replace params in payload with those from url placeholders
   *
   * @param  {string}           payload    The payload
   * @param {HandlerVariables}  variables  Replacements, including match groups and query params
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
}
