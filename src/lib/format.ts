import { Method, Routes } from '../routes';
import { MoxyRequest } from './request';
import { MoxyResponse } from './response';

export const colours = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34;1m',
  purple: '\x1b[35m',
  teal: '\x1b[36;1m',
  majenta: '\x1b[35m',
  none: '\x1b[0;0m',
};

export const methodColours: Record<Method, string> = {
  delete: colours.red,
  get: colours.green,
  patch: colours.yellow,
  post: colours.blue,
  put: colours.purple,
  head: colours.teal,
  connect: colours.teal,
  options: colours.teal,
  trace: colours.teal,
};

export const formatMethod = (method: Method): string =>
  `${methodColours[method?.toLowerCase?.() as Method]}${method.toUpperCase()}\x1b[0m`;

export const formatStatus = (status: number): string => {
  if (status >= 500) {
    return `${colours.red}${status}${colours.none}`;
  }
  if (status >= 400) {
    return `${colours.yellow}${status}${colours.none}`;
  }
  if (status >= 300) {
    return `${colours.teal}${status}${colours.none}`;
  }
  if (status >= 200) {
    return `${colours.green}${status}${colours.none}`;
  }
  if (status >= 100) {
    return `${colours.majenta}${status}${colours.none}`;
  }
  return status.toString();
};

export const formatBody = (body: string | Buffer | Record<string, any>): string | Buffer => {
  if (typeof body === 'string') {
    return body?.length > 1500 ? `${body.slice(0, 1000)} ...` : body;
  }

  if (Buffer.isBuffer(body)) {
    return body.length > 100 ? body : body.toString();
  }

  return JSON.stringify(body);
};

export const formatRouteResponse = (req: MoxyRequest, res: MoxyResponse): string => {
  return [
    formatMethod(req.method as Method),
    `${colours.teal}${req.url}${colours.none}`,
    '=>',
    formatStatus(res.statusCode),
    `\n${formatBody(res.body)}`,
  ].join(' ');
};

export const formatRoutesForPrinting = (routes: Routes, expandFunction = true): string => {
  const replacer = (_key: string, value: unknown): unknown => {
    if (typeof value === 'function') {
      return expandFunction ? value.toString() : '[Function: handler]';
    }

    return value;
  };

  return JSON.stringify(routes, replacer);
};
