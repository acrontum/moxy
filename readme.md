# Moxy


Simple, configurable mock / proxy server.

---

<div style="display: flex; justify-content: center;">
  <a href="https://github.com/acrontum/moxy" alt="Github acrontum/moxy" style="margin-left: 0.5rem; margin-right: 1rem;">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/docker/v/acrontum/moxy">
  </a>

  <a href="https://www.npmjs.org/package/@acrontum/moxy" alt="npm @acrontum/moxy" style="margin-left: 0.5rem; margin-right: 1rem;">
    <img alt="npm (scoped)" src="https://img.shields.io/npm/v/@acrontum/moxy">
  </a>

  <a href="https://hub.docker.com/r/acrontum/moxy/tags" alt="Dockerhub acrontum/moxy" style="margin-left: 0.5rem; margin-right: 1rem;">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/docker/v/acrontum/moxy">
  </a>
</div>

<!-- 
to regen: 
  npx doctoc --github readme.md

then manually remove %5C from the routes
-->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Quick start](#quick-start)
  - [Programatic](#programatic)
  - [CLI](#cli)
  - [Docker](#docker)
  - [Docker compose](#docker-compose)
- [Usage](#usage)
  - [Programatic](#programatic-1)
  - [Via HTTP requests](#via-http-requests)
  - [From files](#from-files)
  - [Static files](#static-files)
  - [More examples](#more-examples)
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

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Quick start

### Programatic

```bash
npm i -D @acrontum/moxy
```

```typescript
import { MoxyServer } from '@acrontum/moxy';

const moxy = new MoxyServer();

moxy.on('hello/world', {
  get: {
    status: 200,
    body: {
      message: 'Welcome!'
    }
  }
});

await moxy.listen(5000);
```


### CLI

```bash
npx @acrontum/moxy --port 5000 --routes ./routes/
```

### Docker

```bash
docker run \
  --name moxy \
  --publish 5000:5000 \
  --volume $PWD/routes:/opt/routes \
   acrontum/moxy --port 5000 --routes /opt/routes
```

### Docker compose

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
      - 5000:80
    init: true
    command: --allowHttpRouteConfig --routes /opt/routes
```

## Usage

The example config (found [here](./example/)) has configuration options with comments.

### Programatic

```typescript
import { MoxyServer } from '@acrontum/moxy';

// initialize with default settings (optional)
const moxy = new MoxyServer({
  logging: 'verbose',
  router: {
    allowHttpRouteConfig: false
  }
});

// start listening on port 5000 (can be done before or after route configuration)
await moxy.listen(5000);

// configure listener for a GET /some/path, responding with a 200 and text body "Hi!"
moxy.on('/some/path', {
  get: {
    status: 200,
    body: 'Hi!',
    headers: { 'Content-Type': 'text/plain' }
  }
});

// configure multiple routes (/auth/login, /auth/logout, and /auth/register) by prefix:
moxy.onAll('/auth/', {
  '/login/': {
    post: {
      status: 401, 
      body: { message: 'Unauthorized' }
    }
  },
  '/logout/': {
    post: {
      stauts: 204
    }
  },
  '/register/': {
    post: {
      status: 201,
      body: { message: 'welcome' }
    }
  }
});

// handle all methods with an HTTP request handler
moxy.on('/not/a/test', (req: MoxyRequest, res: MoxyResponse, variables: HandlerVariables) => {
  console.log('Hi world.');
  return res.sendJson({ pewPew: 'lazors' });
});

// using basic variable replacement, search in a static folder and return an image
moxy.on('/users/:userId/profile-picture', '/static/images/:userId.png');

// ... make requests against moxy

// stop the server. closeConnections: true will not wait for any requests to finish.
await moxy.close({ closeConnections: true });
```

See [API](#api) for full usage.

### Via HTTP requests

Assuming moxy is running at localhost:5000, and has [HTTP config](#api) enabled:

```bash
# hit the moxy api
curl localhost:5000/_moxy/

# add a new handler that responds to GET /test/path with a 204 no content
curl localhost:5000/_moxy/routes \
  -H 'Content-Type: application/json' \
  -d '{ 
    "path": "/test/path", 
    "config": { 
      "get": { 
        "status": 200, 
        "body": "neat" 
      } 
    } 
  }'

# will show the array of paths avaiable
curl localhost:5000/_moxy/routes

# will show paths and their handler object currently configured
curl localhost:5000/_moxy/router

# test our new route
curl localhost:5000/test/path

# remove our new route
curl -X DELETE localhost:5000/_moxy/routes/test/path

# add a "once" route handler
curl localhost:5000/_moxy/routes?once=true \
  -H 'Content-Type: application/json' \
  -d '{ 
    "path": "/pew/pew", 
    "config": { 
      "get": { 
        "status": 200, 
        "body": "neat" 
      } 
    } 
  }'

# 200
curl localhost:5000/pew/pew

# 404
curl localhost:5000/pew/pew
````

Note that you will not be able to configure the response using a function via HTTP.

See [API](#api) for full usage.

### From files

Moxy can load routing configs from the filesystem, searching recursively for `.js` or `.json` files matching `<anything>.routes.js(on)`. This allows you to organize routes into files, and put them in a routes folder (see [example](./example/)).

```typescript
await moxy.router.addRoutesFromFolder('/path/to/routes/folder');
```

```bash
# npx cli
npx @acrontum/moxy --routes /path/to/routes/folder

# docker run
docker run acrontum/moxy --routes /path/to/routes/folder
```

```yaml
version: "3.7"

services:
  moxy:
    image: acrontum/moxy
    volumes:
      - ./routes:/opt/routes
    command: --routes /opt/routes
```

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

### Static files

When you configure a method to be a string, moxy will serve files from disk:

```typescript
export const routes = {
  '/static/(?<file>.*)': {
    get: '/public/:file',
  },
  '/assets/(?<file>.*)': {
    get: '/images/:file',
  }
}

// or 

moxy
  .on('/static/(?<file>.*)', { get: '/public/:file' })
  .on('/assets/(?<file>.*)', { get: '/images/:file' });
````

With the above config, moxy will look in the `./public` folder for requests to `/static/path/to/file`, and the `./images` folder for requests to `/assets/path/to/file`.

These are relative to the process's current directory, so if you ran from this folder it would look in `./images` and `./public` and try to return the file.

### More examples

example config (found [here](./example/)):

```typescript
import { HandlerVariables, MoxyRequest, MoxyResponse, Routes } from '@acrontum/moxy';

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
  // params will still be returned in HandlerVariables if you use a request 
  // handler (see below).
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
```

## API

See [full API docs](./docs/README.md).


### CLI options

```bash
# npx @acrontum/moxy --help

Start a mocking server

options:
-r, --routes FOLDER     Add routes from FOLDER. Can be called multiple times,
                        FOLDER can be multiple separated by comma (,).
-p, --port PORT         Run on port PORT. If none specified, will find an
                        avaiable port.
-q, --quiet             Decrease log verbosity.
-a, --allowHttpConfig   Allow routes config via HTTP methods. Default false.
-h, --help              Show this menu.
```

### HTTP API

Moxy exposes some default HTTP routes for checking routing configurations. With [`allowHttpRouteConfig`](./docs/interfaces/ServerConfig.md#router) enabled:

```typescript
const server = new MoxyServer({ router: { allowHttpRouteConfig: true } });
```
```bash
npx @acrontum/moxy --allowHttpConfig
```

it will also expose HTTP CRUD routes.

The HTTP API offers most of the functionality that programatic or file configs offer, although it is not possible to send request handler methods at this time.

#### GET /\_moxy:

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

#### GET /\_moxy/routes

Display a list of routes which moxy is listening to with default query params (if applicable).

Query params:

`once=true`: Show routes which will fire once then be removed (eg for testing).

`serializeMethods=false`: Don't call `.toString()` on methods (removes some noise).

#### GET /\_moxy/router

Will return the current router config, including response handlers.

Query params:

`once=true`: Show routes which will fire once then be removed (eg for testing).

`serializeMethods=false`: Don't call `.toString()` on methods (removes some noise).

#### POST /\_moxy/router

Will add a json payload to the router.

The payload should contain `path` and `config`, where `path` is the router path and `config` is [`RouteConfig`](docs/README.md#routeconfig):
```json
{
  "path": "/some/path",
  "config": {
    "get": {
      "status": 200
    }
  }
}
```

Query params:

`once=true`: As soon as this route is hit, remove it.

The response will be a 200 containing the newly added route.

#### PATCH /\_moxy/router/:route

Will update the route specified by `:route` (`:route` will match everything after `/router/` including slashes).

Payload: [`RouteConfig`](docs/README.md#routeconfig).

The response will be a 200 containing the newly updated route.

#### PUT /\_moxy/router/:route

Will replace the route specified by `:route` (`:route` will match everything after `/router/` including slashes).

Payload: [`RouteConfig`](docs/README.md#routeconfig).

The response will be a 200 or 201 containing the created or updated route.

#### DELETE /\_moxy/router/:route

Will delete the route specified by `:route` (`:route` will match everything after `/router/` including slashes).

The response will be a 200 containing `{ message: 'Ok' }`;
