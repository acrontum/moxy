import { OutgoingHttpHeaders } from 'http';
import { RequestOptions } from 'https';
import { MoxyRequest, MoxyResponse, MoxyServer } from '..';

/**
 * Path and query params
 */
export type HandlerVariables = Record<string, string | string[]>;

/**
 * Common http verbs
 */
export type Method = 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace';

/**
 * Manual request handler
 */
export type RequestHandler = (
  req: MoxyRequest,
  res: MoxyResponse,
  variables: HandlerVariables,
  server: MoxyServer
) => void;

export interface PathSettings {
  /**
   * If set, will proxy all requests to the target
   */
  proxy?: string;
  /**
   * Options to pass through proxy
   */
  proxyOptions?: RequestOptions;
  /**
   * Method-level delay (in milliseconds)
   */
  delay?: number;
  /**
   * If true, will not parse route as regex
   */
  exact?: true;
}

export interface MethodSettings extends PathSettings {
  /**
   * status code to return (defaults to 200)
   */
  status?: number;
  /**
   * response payload
   */
  body?: any;
  /**
   * headers to add (Content-Type is added automatically)
   */
  headers?: OutgoingHttpHeaders;
  /**
   * HTTP request handler function
   */
  handler?: RequestHandler;
}

/**
 * Configuration for a method.
 * Would be configured as { get: MethodConfig, post: MethodConfig, ... }
 *
 * examples
 *
 * Standard http response:
 *   {
 *     status: 200,
 *     body: { message: 'hello' },
 *   }
 *
 * Manual request listener method:
 *   async (req, res, vars) => res.sendJson({ url: req.url, date: Date.now() }, { status: 201 });
 *
 * Static file:
 *   '/static/:file'
 *
 */
export type MethodConfig = MethodSettings | string | RequestHandler;

/**
 * Configuration for a path.
 */
export type PathConfig = PathSettings & { all?: MethodConfig } & { [key in Method]?: MethodConfig };

/**
 * Configuration for a route.
 */
export type RouteConfig = string | RequestHandler | PathConfig;

/**
 * Configuration for multiple routes.
 */
export type Routes = Record<string, RouteConfig>;

export * from './router';
