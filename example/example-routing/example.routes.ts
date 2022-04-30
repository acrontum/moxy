import { HandlerVariables, MoxyRequest, MoxyResponse, Routes } from '../../src';

export const routeConfig: Routes = {
  // example using basic path params and replacements.
  '/:machineId/measurements/:measurementId': {
    get: {
      status: 200,
      // variables from the path can be injected into the response.
      // The simple version is ":variableName" in the path params and body. By
      // default, this will only match word boundaries (eg /:variable/).
      body: `<!DOCTYPE html><html>
        <head>
          <meta charset="utf-8">
          <title>:machineId/:measurementId</title>
        </head>
        <body>
          <h1>Machine: :machineId - measurement: :measurementId</h1>
        </body>
      </html>`,
      headers: {
        'Content-Type': 'text/html',
      },
    },
  },
  // The more complicated method is using regex capture groups. This allows for
  // more control over how groups are captured (eg for matching slashes in the
  // path.
  '/static/(?<file>.*)': {
    // When the value for a method is a simple string, a file is assumed.
    get: '/public/:file',
  },
  'auth/login': {
    post: {
      status: 200,
      body: {
        active: true,
        user_id: 'user_id',
      },
    },
  },
  '/users/:username': {
    patch: {
      status: 200,
      body: {
        firstName: 'pat',
        username: ':username',
      },
    },
    get: {
      status: 200,
      body: {
        firstName: 'pat',
        username: ':username',
      },
    },
  },
  // example which proxies requests from moxy.test/proxied-server/<target> to google/<target>
  'proxied-server(?<path>.*)': {
    // here, everything after proxied-server is passed through to the proxy target
    proxy: 'https://www.google.com:path',
    // proxy options are the same as http request options, and are passed through.
    proxyOptions: {
      headers: {
        'x-auth-token': 'totally-real',
      },
    },
  },
  'manual-override': (request: MoxyRequest, response: MoxyResponse, variables: HandlerVariables) => {
    response.writeHead(418);
    response.end('I am a teapot');
  },
  'partly-manual-override/:userId': {
    get: {
      status: 418,
      body: 'I am a teapot',
    },
    post: (request: MoxyRequest, response: MoxyResponse, variables: HandlerVariables) => {
      response.writeHead(201);
      response.end(`Brew started for ${variables.userId}`);
    },
  },
  '/glacial/': {
    // slow all methods by 100ms
    delay: 100,
    get: {
      // slow only 1 method by 100ms
      delay: 100,
      status: 204,
    },
    delete: {
      status: 204,
    },
  },
  // note that by default, the path is converted to a regex, so special chars
  // should be escaped
  '/path/with/query\\?search=:theSearchThing': {
    get: {
      body: 'you searched for :theSearchThing',
      headers: { 'Content-Type': 'text/plain' },
    },
  },
  // passing exact: true will prevent the path from being converted to a regex.
  // NOTE: this will also disable simple or regex replacements. Parsed query
  // params will still be returned in the variables for replacement.
  '/exact/match/:notCaptured?queryMustHave': {
    exact: true,
    get: {
      status: 204,
    },
  },
  // if the handler would normally be a function and exact matching is desired,
  // the 'all' method can be used to achieve this.
  '/exact/match/handler?ignore=(.*)': {
    exact: true,
    all: (request: MoxyRequest, response: MoxyResponse, variables: HandlerVariables) => {
      return response.sendJson({ matchedExactly: true });
    },
  },
};
