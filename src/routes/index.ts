import { OutgoingHttpHeaders } from 'http';
import { RequestOptions } from 'https';
import { MoxyRequest, MoxyResponse } from '../lib';

/**
 * Path and query params
 */
export type HandlerVariables = Record<string, string | string[]>;

/**
 * Manual request handler
 */
export type RequestHandler = (req: MoxyRequest, res: MoxyResponse, variables: HandlerVariables) => void;

export interface ProxySettings {
  /**
   * If set, will proxy all requests to the target
   */
  proxy?: string;
  /**
   * Options to pass through proxy
   */
  proxyOptions?: RequestOptions;
}

/**
 * Common http verbs
 */
export type Method = 'connect' | 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put' | 'trace';

export interface DelaySettings {
  /**
   * Method-level delay (in milliseconds)
   */
  delay?: number;
}

export type PathSettings = ProxySettings & DelaySettings;

export interface Route extends PathSettings {
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
   * headers to add (Content-Type is added automatically)
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
export type MethodConfig = Route | string | RequestHandler;

/**
 * Configuration for a path.
 */
export type PathConfig = PathSettings & { [key in Method]?: MethodConfig };

/**
 * Configuration for a route.
 */
export type RouteConfig = RequestHandler | PathConfig;

/**
 * Configuration for multiple routes.
 */
export type Routes = Record<string, RouteConfig>;
