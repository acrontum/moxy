# Moxy


Simple, configurable mock / proxy server with 0 dependencies.

<p align="center">
  <a href="https://www.npmjs.org/package/@acrontum/moxy" alt="npm @acrontum/moxy">
    <img alt="npm (scoped)" src="https://img.shields.io/npm/v/@acrontum/moxy">
  </a>

  <a href="https://hub.docker.com/r/acrontum/moxy/tags" alt="Dockerhub acrontum/moxy">
    <img alt="Docker Image Version (latest semver)" src="https://img.shields.io/docker/v/acrontum/moxy?label=dockerhub">
  </a>

  <a href="https://github.com/acrontum/moxy" alt="Github acrontum/moxy">
    <img alt="GitHub tag (latest SemVer)" src="https://img.shields.io/github/v/tag/acrontum/moxy">
  </a>

  <img alt="npm bundle size" src="https://img.shields.io/bundlephobia/min/@acrontum/moxy">
</p>


---

<!--
to regen:
  npx doctoc --github readme.md

then manually remove %5C from the routes
-->

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Installation](#installation)
- [Examples (see the example folder)](#examples-see-the-example-folder)
  - [Simple server](#simple-server)
  - [Use it in tests](#use-it-in-tests)
  - [Using variable replacement](#using-variable-replacement)
  - [Configure a basic file server:](#configure-a-basic-file-server)
  - [Use as a proxy](#use-as-a-proxy)
  - [Use it to serve a local folder as a git repo (eg in tests which depend on a `git clone`)](#use-it-to-serve-a-local-folder-as-a-git-repo-eg-in-tests-which-depend-on-a-git-clone)
- [Setup](#setup)
  - [Programatic](#programatic)
  - [CLI](#cli)
  - [Docker](#docker)
  - [Docker compose](#docker-compose)
- [Usage](#usage)
  - [Programatic](#programatic-1)
  - [Via CLI](#via-cli)
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

## Installation

```bash
npm i -D @acrontum/moxy
```

## Examples (see [the example folder](./example))

### Simple server
```typescript
import { MoxyServer } from '@acrontum/moxy';

const moxy = new MoxyServer();

moxy.on('/api/cats', {
  get: {
    body: [
      { name: 'alice', flavour: 'yellow' },
      { name: 'bob', flavour: 'black' },
      { name: 'cheshire', flavour: 'stripey' }
    ]
  }
});

moxy.on('/api/cats/alice', {
  get: {
    body: { 
      name: 'alice', 
      flavour: 'yellow'
    }
  }
});

moxy.listen(5000);

// curl localhost:5000/api/cats
//   -> 200 [{"name":"alice","flavour":"yellow"},{"name":"bob","flavour":"black"},{"name":"cheshire","flavour":"stripey"}]
// curl localhost:5000/api/cats/alice
//   -> 200 {"name":"alice","flavour":"yellow"}
```

### Use it in tests
```typescript
import { expect } from 'chai';
import { after, afterEach, before } from 'mocha';
import { default as supertest } from 'supertest';
import { MoxyServer } from '@acrontum/moxy';
import { MyApplication } from '../path/to/my/app/src';

describe('API auth', () => {
  const moxy: MoxyServer = new MoxyServer({ logging: 'error' });
  let request: supertest.SuperTest<supertest.Test>;

  before(async () => {
    moxy.on('/auth/login', {
      post: {
        status: 200,
        body: {
          username: 'bob'
        },
        headers: {
          'Set-Cookie': 'om-nom-nom;'
        }
      }
    });
    await moxy.listen(5001);

    MyApplication.configure({ authUrl: 'http://localhost:5001' });
    await MyApplication.start();

    request = supertest(MyApplication.expressApp);
  });

  after(async () => {
    await moxy.close({ closeConnections: true });
    await MyApplication.stop();
  });

  it('can authenticate users', async () => {
    await request.post('/v1/login').send({ username: 'bob', password: 'yes' })  
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({ username: 'bob' });
      });

    // no more spyOn(http.send)!
    // test your full E2E http request flow
    moxy.once('/auth/login', {
      post: {
        status: 401,
        body: {
          message: 'Unknown user or invalid password'
        }
      }
    });

    await request.post('/v1/login').send({ username: 'bob', password: 'yes' })  
      .expect(({ status, body }) => {
        expect(status).equals(401);
        expect(body).equals('Failed to login');
      });
  });
});
```

### Using variable replacement
```typescript
import { MoxyServer } from '@acrontum/moxy';

const moxy = new MoxyServer();

moxy.on('/echo/:name', {
  get: {
    status: 200,
    body: {
      hello: ':name'
    },
  }
});

moxy.on('/echo-with-slash/(?<pathWithSlash>.+)', {
  get: {
    status: 200,
    body: {
      hello: ':pathWithSlash'
    },
  }
});

moxy.listen(5000);

// curl localhost:5000/echo/bob
//   -> 200 {"hello":"bob"}

// curl localhost:5000/echo-with-slash/this/will/be/in/the/body
//   -> 200 {"hello":"this/will/be/in/the/body"}
```

### Configure a basic file server:
```typescript
import { MoxyServer } from '@acrontum/moxy';
import { createWriteStream, promises } from 'fs';
import { join, dirname, resolve } from 'path';

const moxy = new MoxyServer();

// simple file server (GET only)
moxy.on('/v1/assets/:filename', './assets/:filename');

// file server with upload
moxy.on('/v1/database/:filename', {
  get: './disk-db/:filename',
  put: async (req, res, vars) => {
    if (/\.\./.test(vars.filename)) {
      return res.sendJson({ status: 422, message: 'Invalid filename' });
    }

    const outfile = join('./disk-db', vars.filename);
    await promises.mkdir(resolve(dirname(outfile)), { recursive: true });

    const output = createWriteStream(outfile, 'utf-8');
    req.on('end', () => res.sendJson({ status: 201, message: 'ok' }));

    req.pipe(output);
  }
});

moxy.listen(5000);

/*
mkdir assets/
echo 'hello world!' > assets/welcome.txt

curl localhost:5000/v1/assets/hello.html
#  -> 404

curl localhost:5000/v1/assets/welcome.txt
#  -> 200 hello world!


curl localhost:5000/v1/database/passwords.txt
#  -> 404

curl -XPUT localhost:5000/v1/database/passwords.txt -d 'admin=super-secret'
#  -> 201

curl localhost:5000/v1/database/passwords.txt
#  -> 200 admin=super-secret
*/
```

### Use as a proxy
```typescript
import { MoxyServer } from '@acrontum/moxy';

const moxy = new MoxyServer({ router: { allowHttpRouteConfig: true } });

// transparent proxy moxy -> google
moxy.on('/(?<path>.*)', {
  proxy: 'https://www.google.ca/:path'
});

moxy.listen(5000);

/*

open http://localhost:5000/search?q=acrontum/moxy

since we allowed httpConfig, we can do this from the browser devtools:

fetch('http://localhost:5000/_moxy/routes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    path: '/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png',
    config: {
      proxy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Flag_of_Canada_%28Pantone%29.svg/255px-Flag_of_Canada_%28Pantone%29.svg.png'
    }
  })
});

and now when we refresh, the google logo is a Canada flag (much better, eh?)
*/
```

### Use it to serve a local folder as a git repo (eg in tests which depend on a `git clone`)

```typescript
import { HandlerVariables, MoxyRequest, MoxyResponse, MoxyServer } from '@acrontum/moxy';
import { exec, spawn } from 'child_process';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';

const moxy = new MoxyServer();

const run = promisify(exec);

const pack = (service: string) => {
  const name = `# service=${service}\n`;
  const len = (4 + name.length).toString(16);

  return `${Array(4 - len.length + 1).join('0')}${len}${name}0000`;
};

const getRepo = (repoName: string) => join('./repos', repoName.replace('.git', ''));

moxy.on('/projects/:repo/info/refs\\?service=:service', {
  get: async (req: MoxyRequest, res: MoxyResponse, vars: HandlerVariables): Promise<MoxyResponse> => {
    const repo = getRepo(vars.repo as string);
    const service = vars.service as string;

    if (!existsSync(repo)) {
      return res.sendJson({ status: 404, body: 'Not found', vars });
    }

    try {
      if (!existsSync(join(repo, '.git'))) {
        await run(`git init -q && git add -A && git commit -am init`, { cwd: repo });
      } else {
        await run(`git add -A && git commit -am init || echo 'up to date'`, { cwd: repo });
      }

      res.writeHead(200, {
        'Content-Type': `application/x-${service}-advertisement`,
        'Cache-Control': 'no-cache',
      });
      res.write(pack(service));

      const uploadPack = spawn(service, ['--stateless-rpc', '--advertise-refs', repo]);

      return uploadPack.stdout.pipe(res);
    } catch (e) {
      console.error(e);
    }

    return res.sendJson({ status: 404, body: 'Not found', vars });
  },
});

moxy.on('/projects/:repo/git-upload-pack', {
  post: async (req: MoxyRequest, res: MoxyResponse, vars: HandlerVariables): Promise<MoxyResponse> => {
    const repo = getRepo(vars.repo as string);

    if (!existsSync(repo)) {
      return res.sendJson({ status: 404, body: 'Not found', vars });
    }

    try {
      res.writeHead(200, {
        'Content-Type': 'application/x-git-upload-pack-response',
        'Cache-Control': 'no-cache',
      });

      const proc = spawn(`git-upload-pack`, ['--stateless-rpc', repo]);

      const stream = new Readable();
      stream.push(await req.body);
      stream.push(null);

      stream.pipe(proc.stdin);

      proc.stdout.on('end', () => rm(join(repo, '.git'), { recursive: true }).catch(console.error));

      return proc.stdout.pipe(res);
    } catch (e) {
      console.error(e);
    }

    return res.sendJson({ status: 404, body: 'Not found', vars });
  },
});

moxy.listen(5000);

/*
git clone http://localhost:5000/projects/server.git
git clone http://localhost:5000/projects/app
*/
```


## Setup

### Programatic


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
npx @acrontum/moxy --port 5000 --on '{
  "path": "hello/world",
  "config": {
    "get": {
      "status": 200,
      "body": {
        "message": "Welcome!"
      }
    }
  }
}'
```

### Docker

```bash
docker run \
  --name moxy \
  --publish 5000:5000 \
  --volume $PWD/routes:/opt/routes \
   acrontum/moxy --port 5000 --routes /opt/routes

# OR acrontum/moxy --port 5000 --on '{ "path": "hello/world", "config": { "get": { "status":200, "body":{ "message":"Welcome!" } } } }'
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
    command: --allow-http-config --routes /opt/routes
```

## Usage

The example config (found [here](./example/example-routing/example.routes.ts)) has configuration options with comments.

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
      status: 204
    }
  },
  '/register/': {
    post: {
      status: 201,
      body: { message: 'welcome' }
    }
  }
});

// handle all HTTP verbs with a request handler
moxy.on('/not/a/test', (req: MoxyRequest, res: MoxyResponse, variables: HandlerVariables) => {
  console.log('Hi world.');

  return res.sendJson({ pewPew: 'lazors' });
});

moxy.on('/still/not/a/test', {
  patch: (req: MoxyRequest, res: MoxyResponse, variables: HandlerVariables) => {
    console.log('Updating the world.');

    return res.sendJson({ pewPew: 'lazors' });
  }
});

// load from filesystem
await moxy.router.addRoutesFromFolder('/path/to/my/routes');

// using basic variable replacement, search in a static folder and return an image
moxy.on('/users/:userId/profile-picture', '/static/images/:userId.png');

// ... make requests against moxy

// stop the server. closeConnections: true will not wait for any requests to finish.
await moxy.close({ closeConnections: true });
```

See [API](#api) for full usage.

### Via CLI

```bash
# load from local routes folder, and add single get handler for /hello/world
npx @acrontum/moxy --port 5000 --routes ./routes/ --on '{
  "path": "hello/world",
  "config": {
    "get": {
      "status": 418,
      "body": {
        "message": "I am a teapot"
      }
    }
  }
}'
```

### Via HTTP requests

Assuming moxy is running at localhost:5000, and has [HTTP config](https://acrontum.github.io/moxy/interfaces/ServerConfig.html#router) enabled:

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
```

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
  // same thing, just short form
  '/assets/(?<file>.*)': '/images/:file'
}

// or

moxy
  .on('/static/(?<file>.*)', { get: '/public/:file' })
  .on('/assets/(?<file>.*)', '/images/:file');
```

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

See [full API docs](https://acrontum.github.io/moxy/).


### CLI options

```bash
# npx @acrontum/moxy --help
Start a mocking server

options:
-r, --routes FOLDER       Add routes from FOLDER. Can be called multiple times,
                          FOLDER can be multiple separated by comma (,).
-p, --port PORT           Run on port PORT. If none specified, will find an
                          avaiable port.
-o, --on CONFIG           Add json CONFIG to routes.
-q, --quiet               Decrease log verbosity.
-a, --allow-http-config   Allow routes config via HTTP methods. Default false.
-v, --version             Show build version and exit.
-h, --help                Show this menu.
```

### HTTP API

Moxy exposes some default HTTP routes for checking routing configurations. With [`allowHttpRouteConfig`](https://acrontum.github.io/moxy/interfaces/ServerConfig.html#router) enabled:

```typescript
const server = new MoxyServer({ router: { allowHttpRouteConfig: true } });
```
```bash
npx @acrontum/moxy --allow-http-config
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

The payload should contain `path` and `config`, where `path` is the router path and `config` is [`RouteConfig`](https://acrontum.github.io/moxy/index.html#routeconfig):
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

Payload: [`RouteConfig`](https://acrontum.github.io/moxy/index.md#routeconfig).

The response will be a 200 containing the newly updated route.

#### PUT /\_moxy/router/:route

Will replace the route specified by `:route` (`:route` will match everything after `/router/` including slashes).

Payload: [`RouteConfig`](https://acrontum.github.io/moxy/index.md#routeconfig).

The response will be a 200 or 201 containing the created or updated route.

#### DELETE /\_moxy/router/:route

Will delete the route specified by `:route` (`:route` will match everything after `/router/` including slashes).

The response will be a 200 containing `{ message: 'Ok' }`;
