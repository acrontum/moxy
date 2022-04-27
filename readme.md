# Moxy
Simple mock / proxy server.

<!-- npx doctoc --github readme.md  -->
<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Quick start](#quick-start)
  - [Programatic](#programatic)
  - [CLI](#cli)
  - [Docker](#docker)
- [API](#api)
- [CLI options](#cli-options)
- [HTTP API](#http-api)
  - [GET /\_moxy:](#get-_moxy)
  - [GET /\_moxy/routes](#get-_moxyroutes)
  - [GET /\_moxy/router](#get-_moxyrouter)
  - [POST /\_moxy/router](#post-_moxyrouter)
  - [PATCH /\_moxy/router/:route](#patch-_moxyrouterroute)
  - [PUT /\_moxy/router/:route](#put-_moxyrouterroute)
  - [DELETE /\_moxy/router/:route](#delete-_moxyrouterroute)
- [Modifying shared routes](#modifying-shared-routes)
- [Static files](#static-files)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Quick start

### Programatic

```bash
npm i @acrontum/moxy
```

```typescript
import { MoxyServer } from '@acrontum/moxy';

const mocker = new MoxyServer();
await mocker.listen(8080);
```


### CLI

```bash
npx @acrontum/moxy --help
```


### Docker

```bash
docker run --rm --name moxy --detach --interactive --tty --publish 1234:1234 --mount type=bind,src=$PWD/routes,dst=/opt/routes,ro acrontum/moxy --port 1234 --route /opt/routes
```

or with docker-compose
```yaml
version: "3.7"

services:
  moxy:
    image: acrontum/moxy
    container_name: moxy
    volumes:
      - ./routes:/opt/routes
    environment:
      - PORT=80
    ports:
      - 8443:80
    init: true
    command: --allowHttpRouteConfig
```

## API

```typescript
interface ServerConfig {
    /**
     * Set log level.
     */
    logging?: LogLevels;
    /**
     * Configuration passed to router.
     */
    router?: RouterConfig;
}

interface CloseServerOptions {
    /**
     * If true, will force close all sockets.
     */
    closeConnections?: boolean;
}

interface RouterConfig {
    /**
     * If true, exposes CRUD routes for path config.
     */
    allowHttpRouteConfig?: boolean;
}

class MoxyServer {
    /**
     * Instance of HTTP server.
     */
    server?: Server;
    /**
     * The internal router.
     */
    router: Router;
    constructor(config?: ServerConfig);
    /**
     * The listening server port.
     *
     * @type {number}
     */
    get port(): number;
    /**
     * Sets the log verbosity.
     *
     * @param {string}  value  Log level
     */
    setLogging(value: string): void;
    /**
     * Add path config handler.
     *
     * @param  {string}       path    The path
     * @param  {RouteConfig}  config  The configuration
     *
     * @return {this}
     */
    on(path: string, config: RouteConfig | Routes): this;
    /**
     * Remove path handler.
     *
     * @param  {string}  path  The path
     *
     * @return {this}
     */
    off(path: string): this;
    /**
     * Add path handler which removes its self after the first response.
     *
     * @param  {string}       path    The path
     * @param  {RouteConfig}  config  The configuration
     *
     * @return {this}
     */
    once(path: string, config: RouteConfig | Routes): this;
    /**
     * Clear all routing config
     *
     * @return {this}
     */
    resetRoutes(): this;
    /**
     * Start the HTTP server
     *
     * @param  {number}           [port=0]  The port. If none spcified, will use a random port
     *
     * @return {Promise<Server>}
     */
    listen(port?: number): Promise<Server>;
    /**
     * Close the HTTP server.
     *
     * @param  {CloseServerOptions}  options  Close server options
     *
     * @return {Promise<void>}
     */
    close(options?: CloseServerOptions): Promise<void>;
}
````


## CLI options

```bash
Start a mocking server

options:
-r, --route FOLDER      Add routes from FOLDER. Can be called multiple times,
                        FOLDER can be multiple separated by comma (,).
-p, --port PORT         Run on port PORT. If none specified, will find an
                        avaiable port.
-q, --quiet             Decrease log verbosity.
-a, --allowHttpConfig   Allow routes config via HTTP methods. Default false.
-h, --help              Show this menu.
```

## HTTP API

By default, moxy exposes routes for checking configurations:

If you enable `allowHttpRouteConfig` in the moxy router options:
```typescript
const server = new MoxyServer({ router: { allowHttpRouteConfig: true } });
```
```bash
npx @acrontum/moxy --allowHttpConfig
```

### GET /\_moxy:
Returns the list of api methods:
```
{
  "GET /router?once=false&serializeMethods=true": "show router",
  "GET /routes?once=false": "show router routes"
}
 - or -
{
  "GET /router?once=false&serializeMethods=true": "show router",
  "GET /routes?once=false": "show router routes",
  "POST /routes?once=false": "create route",
  "PUT /routes/:route": "create or update route",
  "PATCH /routes/:route": "update route",
  "DELETE /routes/:route": "delete route",
}

```

### GET /\_moxy/routes
Display a list of routes which moxy is listening to with default query params (if applicable).

Query params:

`once=true`: Show routes which will fire once then be removed (eg for testing).

`serializeMethods=false`: Don't call `.toString()` on methods (removes some noise).

### GET /\_moxy/router
Will return the current router config, including response handlers.

Query params:

`once=true`: Show routes which will fire once then be removed (eg for testing).

`serializeMethods=false`: Don't call `.toString()` on methods (removes some noise).

### POST /\_moxy/router
Will add a json payload to the router.

Payload:

json `RouteConfig | Routes` (see ./src/routes/index.ts).


Query params:

`once=true`: As soon as this route is hit, remove it.

### PATCH /\_moxy/router/:route
Will update the route specified by `:route`.

Payload:

json `RouteConfig | Routes` (see ./src/routes/index.ts).

### PUT /\_moxy/router/:route
Will replace the route specified by `:route`.

Payload:

json `RouteConfig | Routes` (see ./src/routes/index.ts).

### DELETE /\_moxy/router/:route
Will delete the route specified by `:route`.

## Modifying shared routes

Moxy will load routing configs from a file system, searching recursively for `.js` or `.json` files matching `<anything>.routes.js(on)`. This allows you to organize routes into files, and put them in a routes folder (see [example](./example/)).

When loading routes from folders, the tree structure will determine the routing. For instance, if your folder structure looks like this:
```
public/
├── routes
│   ├── a
│   │   ├── a.routes.js
│   │   └── b
│   │       └── b.routes.js
│   └── c
│       └── c.routes.json
└── static
    ├── css
    ├── js
    └── index.html
```

And you loaded the `public` folder into moxy's router, your route config would look like:
```json
{
  "/public/routes/a/": "...config from a.routes.js file",
  "/public/routes/a/b/": "...config from b.routes.js file",
  "/public/routes/c": "...config from c.routes.json file"
}
```

If you instead loaded the `a` folder, it would look like:
```json
{
  "/a/": "...config from a.routes.js file",
  "/a/b/": "...config from b.routes.js file",
}
```

example config:  
```typescript
import { HandlerVariables, MoxyRequest, MoxyResponse, Routes } from '../../src';

export const routeConfig: Routes = {
  // example using basic path params and replacements.
  '/:machineId/measurements/:measurementId': {
    get: {
      status: 200,
      // variables from the path can be injected into the response.
      // The simple version is ":variableName" in the path params and body. By
      // default, this will only match word boundaries (eg /:variable/).
      // The more complicated method is using regex capture groups. This allows
      // for nested paths or more control over how groups are captured.
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
  // using named capture group to include slashes
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
      status: 204
    },
    delete: {
      status: 204
    }
  }
};

```

## Static files

When you configure a path to serve files in a route, eg:

```typescript
export const routes = {
  '/static/(?<file>.*)': {
    get: '/public/:file',
  },
  '/assets/(?<file>.*)': {
    get: '/images/:file',
  }
}
````

Moxy will look in the `public` folder for requests to `/static/path/to/file`, and the `images` folder for requests to `/assets/path/to/file`.

These are relative to the process's current directory, so if you ran from this folder it would look in `./images` and `./public` and try to return the file.
