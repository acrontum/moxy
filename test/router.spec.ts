import assert from 'node:assert';
import { join, relative } from 'node:path';
import { after, afterEach, before, describe, it } from 'node:test';
import { routeConfig } from '../examples/example-routing/example.routes';
import { MoxyServer, PathConfig, RequestHandler } from '../src';
import { getRequest, TestRequest } from './shared/test-util';

type NetError = {
  address: string;
  code: string;
  errno: number;
  port: number;
  syscall: string;
};

describe(relative(process.cwd(), __filename), async () => {
  const moxy: MoxyServer = new MoxyServer({ logging: 'error' });
  let request: TestRequest;

  before(async () => {
    await moxy.listen();
    request = getRequest(moxy);
  });

  afterEach(() => {
    moxy.resetRoutes();
  });

  after(async () => {
    await moxy.close({ closeConnections: true });
  });

  await it('can configure routes', async () => {
    await request.get('/example-routing/12345/measurements/76543').expect(404);
    await request.get('/example-routing/static/image.png').expect(404);
    await request.post('/example-routing/auth/login').expect(404);
    await request.patch('/example-routing/users/me').expect(404);
    await request.get('/example-routing/proxied-server/test?q=asdf').expect(404);
    await request.get('/example-routing/manual-override').expect(404);
    await request.get('/example-routing/partly-manual-override/user_id').expect(404);
    await request.delete('/example-routing/glacial/').expect(404);
    await request.get('/example-routing/path/with/query\\?search=:theSearchThing').expect(404);
    await request.get('/example-routing/exact/match/:notCaptured?queryMustHave').expect(404);
    await request.get('/example-routing/exact/match/handler?ignore=(.*)').expect(404);

    // change static file path in exampe from /public/ to /test/
    assert.strictEqual((routeConfig['/static/(?<file>.*)'] as PathConfig).get, '/public/:file');
    (routeConfig['/static/(?<file>.*)'] as PathConfig).get = '/test/:file';

    // google proxy is slow-ish
    const proxy = new MoxyServer({ logging: 'error' });
    proxy.on('/test\\?q=asdf', { get: { status: 418 } });
    await proxy.listen();
    after(() => proxy.close({ closeConnections: true }));

    assert.deepStrictEqual(routeConfig['proxied-server(?<path>.*)'] as PathConfig, {
      proxy: 'https://www.google.com:path',
      proxyOptions: {
        headers: {
          'x-auth-token': 'totally-real',
        },
      },
    });
    (routeConfig['proxied-server(?<path>.*)'] as PathConfig).proxy = `http://localhost:${proxy.port}:path`;

    moxy.onAll('/example-routing', routeConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(body, [
        '/example-routing/:machineId/measurements/:measurementId',
        '/example-routing/static/(?<file>.*)',
        '/example-routing/assets/(?<file>.*)',
        '/example-routing/auth/login',
        '/example-routing/users/:username',
        '/example-routing/proxied-server(?<path>.*)',
        '/example-routing/manual-override',
        '/example-routing/partly-manual-override/:userId',
        '/example-routing/glacial/',
        '/example-routing/path/with/query\\?search=:theSearchThing',
        '/example-routing/exact/match/:notCaptured?queryMustHave',
        '/example-routing/exact/match/handler?ignore=(.*)',
      ]);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(body, {
        '/example-routing/:machineId/measurements/:measurementId': {
          get: {
            status: 200,
            body: '<!DOCTYPE html><html>\n        <head>\n          <meta charset="utf-8">\n          <title>:machineId/:measurementId</title>\n        </head>\n        <body>\n          <h1>Machine: :machineId - measurement: :measurementId</h1>\n        </body>\n      </html>',
            headers: {
              'Content-Type': 'text/html',
            },
          },
        },
        '/example-routing/static/(?<file>.*)': {
          get: '/test/:file',
        },
        '/example-routing/assets/(?<file>.*)': {
          get: '/www-data/:file',
        },
        '/example-routing/auth/login': {
          post: {
            status: 200,
            body: {
              active: true,
              user_id: 'user_id',
            },
          },
        },
        '/example-routing/users/:username': {
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
        '/example-routing/proxied-server(?<path>.*)': {
          proxy: `http://localhost:${proxy.port}:path`,
          proxyOptions: {
            headers: {
              'x-auth-token': 'totally-real',
            },
          },
        },
        '/example-routing/manual-override':
          "(request, response, variables) => {\n        response.writeHead(418);\n        response.end('I am a teapot');\n    }",

        '/example-routing/partly-manual-override/:userId': {
          get: {
            status: 418,
            body: 'I am a teapot',
          },
          post: '(request, response, variables) => {\n            response.writeHead(201);\n            response.end(`Brew started for ${variables.userId}`);\n        }',
        },
        '/example-routing/glacial/': {
          delay: 100,
          get: {
            delay: 100,
            status: 204,
          },
          delete: {
            status: 204,
          },
        },
        '/example-routing/path/with/query\\?search=:theSearchThing': {
          get: {
            body: 'you searched for :theSearchThing',
            headers: { 'Content-Type': 'text/plain' },
          },
        },
        '/example-routing/exact/match/:notCaptured?queryMustHave': {
          exact: true,
          get: {
            status: 204,
          },
        },
        '/example-routing/exact/match/handler?ignore=(.*)': {
          all: '(request, response, variables) => {\n            return response.sendJson({ matchedExactly: true });\n        }',
          exact: true,
        },
      });
    });

    await request.get('/example-routing/12345/measurements/76543').expect(200);
    await request.get('/example-routing/static/fixtures/static/index.html').expect(200);
    await request.post('/example-routing/auth/login').expect(200);
    await request.patch('/example-routing/users/me').expect(200);
    await request.get('/example-routing/proxied-server/test?q=asdf#test').expect(418);
    await request.get('/example-routing/manual-override').expect(418);
    await request.get('/example-routing/partly-manual-override/user_id').expect(418);
    await request.delete('/example-routing/glacial/').expect(204);
    await request.get('/example-routing/path/with/query?search=:theSearchThing').expect(200);
    await request.get('/example-routing/exact/match/:notCaptured?queryMustHave').expect(204);
    await request.get('/example-routing/exact/match/handler?ignore=(.*)').expect(200);
  });

  await it('can read filesystem for routing', async () => {
    await moxy.addRoutesFromFolder(join(__dirname, 'fixtures', 'load-from-dir'));

    const serializedDeleteFuntion =
      "delete(req, res) {\n            return res.writeHead(301, 'google.ca');\n        }";

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(body, {
        '/a/test': { get: { status: 200 } },
        '/a/users/something': { delete: serializedDeleteFuntion },
        '/a/y/test': { get: { status: 200 } },
        '/a/y/users/something': { delete: serializedDeleteFuntion },
        '/a/y/z/test': { get: { status: 200 } },
        '/a/y/z/users/something': { delete: serializedDeleteFuntion },
        '/b/json-b-test': {
          get: {
            status: 200,
          },
        },
        '/b/json-b-test/users/something': {
          delete: {
            body: '<!DOCTYPE html><html><head><title>Nope</title></head><body><h1>405 Method not allowed</h1></body><html>',
            headers: {
              'Content-Type': 'text/html',
            },
            status: 405,
          },
        },
        '/b/test': { get: { status: 200 } },
        '/b/users/something': { delete: serializedDeleteFuntion },
        '/b/x/test': { get: { status: 200 } },
        '/b/x/users/something': { delete: serializedDeleteFuntion },
        '/b/y/test': { get: { status: 200 } },
        '/b/y/users/something': { delete: serializedDeleteFuntion },
        '/b/y/z/test': { get: { status: 200 } },
        '/b/y/z/users/something': { delete: serializedDeleteFuntion },
        '/c/test': { get: { status: 200 } },
        '/c/users/something': { delete: serializedDeleteFuntion },
        '/c/x/test': { get: { status: 200 } },
        '/c/x/users/something': { delete: serializedDeleteFuntion },
        '/c/x/z/test': { get: { status: 200 } },
        '/c/x/z/users/something': { delete: serializedDeleteFuntion },
      });
    });
  });

  await it('can temporarily override a route', async () => {
    await request.get('/hello/world').expect(404);

    moxy.on('/hello/world', {
      get: {
        status: 200,
        body: 'hi!',
      },
    });

    await request.get('/hello/world').expect(({ status, text }) => {
      assert.strictEqual(status, 200);
      assert.strictEqual(text, 'hi!');
    });

    await request.get('/hello/world').expect(({ status, text }) => {
      assert.strictEqual(status, 200);
      assert.strictEqual(text, 'hi!');
    });

    await request.post('/hello/world').expect(404);

    moxy.once('/hello/world', {
      post: {
        status: 201,
        body: { message: 'welcome' },
      },
    });

    await request.get('/hello/world').expect(({ status, text }) => {
      assert.strictEqual(status, 200);
      assert.strictEqual(text, 'hi!');
    });

    await request.post('/hello/world').expect(({ status, body }) => {
      assert.strictEqual(status, 201);
      assert.deepStrictEqual(body, { message: 'welcome' });
    });

    await request.post('/hello/world').expect(404);
    await request.get('/hello/world').expect(200);

    moxy.once('/hello/world', {
      get: {
        status: 418,
        body: 'easteregg',
      },
    });

    await request.get('/hello/world').expect(({ status, text }) => {
      assert.strictEqual(status, 418);
      assert.strictEqual(text, 'easteregg');
    });

    await request.get('/hello/world').expect(({ status, text }) => {
      assert.strictEqual(status, 200);
      assert.strictEqual(text, 'hi!');
    });

    moxy.once('/hello/world', { get: { status: 400 } });
    moxy.once('/hello/world', { get: { status: 401 } });
    moxy.once('/hello/world', { get: { status: 402 } });

    await request.get('/hello/world').expect(400);
    await request.get('/hello/world').expect(401);
    await request.get('/hello/world').expect(402);
    await request.get('/hello/world').expect(200);
  });

  await it('can slow down requests', async () => {
    moxy.on('/test', {
      get: { status: 200 },
      post: {
        status: 201,
        delay: 50,
      },
    });

    let start = Date.now();
    await request.get('/test').expect(200);
    assert.strictEqual(Date.now() - start < 50, true);

    start = Date.now();
    await request.post('/test').expect(201);
    assert.strictEqual(Date.now() - start >= 50, true);

    moxy.on('/top-level-delay', {
      delay: 50,
      get: (_, res) => res.end('neat'),
    });

    start = Date.now();
    await request.get('/top-level-delay').expect(200);
    assert.strictEqual(Date.now() - start >= 50, true);

    moxy.on('/route-and-method-level-delay', {
      delay: 50,
      get: { status: 200 },
      post: {
        status: 201,
        delay: 50,
      },
    });

    start = Date.now();
    await request.post('/route-and-method-level-delay').expect(201);
    assert.strictEqual(Date.now() - start >= 100, true);
  });

  await it('can proxy requests to another server', async () => {
    const proxyTarget = new MoxyServer({ logging: 'error' });
    await proxyTarget.listen(0);
    after(async () => {
      await proxyTarget.close({ closeConnections: true });
    });

    proxyTarget.on('/this/request/was/proxied', {
      get: {
        status: 418,
        body: { message: 'Hello!' },
        headers: { 'X-Proxy-Responder': 'moxy' },
      },
    });

    moxy.on('/proxy/(?<proxyPath>.*)', {
      get: {
        proxy: `http://localhost:${proxyTarget.port}/:proxyPath`,
      },
    });

    await request.get('/proxy/this/request/was/proxied').expect(({ status, body, headers }) => {
      assert.strictEqual(status, 418);
      assert.deepStrictEqual(body, { message: 'Hello!' });
      assert.strictEqual(headers['x-proxy-responder'], 'moxy');
    });

    proxyTarget.on('/proxier', {
      get: {
        status: 418,
        body: { message: 'Hello!' },
        headers: { 'X-Proxy-Responder': 'moxy' },
      },
    });

    moxy.on('/proxy/(?<proxyPath>.*)', {
      get: {
        proxy: 'ssh://moxy.local:56553/:proxyPath',
        proxyOptions: {
          hostname: 'localhost',
          protocol: 'http:',
          port: proxyTarget.port,
        },
      },
    });

    await request.get('/proxy/proxier').expect(({ status, body, headers }) => {
      assert.strictEqual(status, 418);
      assert.deepStrictEqual(body, { message: 'Hello!' });
      assert.strictEqual(headers['x-proxy-responder'], 'moxy');
    });

    moxy.on('/bad-proxy/(?<proxyPath>.*)', {
      get: {
        proxy: 'http://localhost:11/:proxyPath',
      },
    });

    await request
      .get('/bad-proxy/proxier')
      .expect<{ status: number; message: NetError }>(({ status, body, headers }) => {
        assert.deepStrictEqual(
          { status, body },
          {
            status: 502,
            body: {
              status: 502,
              message: {
                code: 'ECONNREFUSED',
                address: body.message.address,
                errno: body.message.errno,
                port: body.message.port,
                syscall: body.message.syscall,
              },
            },
          },
        );
        assert.strictEqual(headers['x-moxy-error'], 'proxy error');
      });

    let timer: NodeJS.Timeout | undefined;
    proxyTarget.on('/slow', {
      get: (_, res) => (timer = setTimeout(() => res.sendJson({ message: 'zzzzzz' }), 1000)),
    });

    moxy.on('/slow-proxy/(?<proxyPath>.*)', {
      get: {
        proxy: `http://localhost:${proxyTarget.port}/slow`,
        proxyOptions: {
          timeout: 10,
        },
      },
    });

    await request.get('/slow-proxy/proxier').expect<{ options: unknown }>(({ status, body, headers }) => {
      assert.deepStrictEqual(
        { status, body },
        {
          status: 504,
          body: {
            status: 504,
            message: 'Proxy timeout',
            options: body.options,
          },
        },
      );
      assert.strictEqual(headers['x-moxy-error'], 'proxy timeout');
    });

    clearTimeout(timer);
  });

  await it('can use query and path params', async () => {
    // explicit handlers for with and without query string
    moxy.on('/test-params/:tpId\\?search=:search', {
      get: {
        status: 401,
        body: [
          ['tpId', ':tpId'],
          ['search', ':search'],
        ],
      },
    });

    moxy.on('/test-params/:tpId', {
      get: {
        status: 402,
        body: [['tpId', ':tpId']],
      },
    });

    await request.get('/test-params').expect(404);
    await request.post('/test-params/asdf').expect(404);

    await request
      .get('/test-params/0118')
      .query({ search: 'ambul' })
      .expect(({ status, body }) => {
        assert.deepStrictEqual(
          { status, body },
          {
            status: 401,
            body: [
              ['tpId', '0118'],
              ['search', 'ambul'],
            ],
          },
        );
      });

    await request.get('/test-params/0118').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 402, body: [['tpId', '0118']] });
    });

    // explicit required query
    moxy.resetRoutes();

    moxy.on('/test-params/:tpId\\?search=:search', {
      get: {
        status: 401,
        body: [
          ['tpId', ':tpId'],
          ['search', ':search'],
        ],
      },
    });

    await request.get('/test-params').expect(404);
    await request.post('/test-params/asdf').expect(404);

    await request
      .get('/test-params/0118')
      .query({ search: 'ambul' })
      .expect(({ status, body }) => {
        assert.strictEqual(status, 401);
        assert.deepStrictEqual(body, [
          ['tpId', '0118'],
          ['search', 'ambul'],
        ]);
      });

    await request.get('/test-params/0118').expect(404);

    // implicit optional query
    moxy.resetRoutes();

    moxy.on('/test-params/:tpId', {
      get: {
        status: 200,
        body: [
          ['tpId', ':tpId'],
          ['search', ':search'],
        ],
      },
    });

    await request.get('/test-params').expect(404);
    await request.post('/test-params/asdf').expect(404);

    await request
      .get('/test-params/0118')
      .query({ search: 'ambul' })
      .expect(({ status, body }) => {
        assert.deepStrictEqual(
          { status, body },
          {
            status: 200,
            body: [
              ['tpId', '0118'],
              ['search', 'ambul'],
            ],
          },
        );
      });

    await request.get('/test-params/0118').expect(({ status, body }) => {
      assert.strictEqual(status, 200);
      assert.deepStrictEqual(body, [
        ['tpId', '0118'],
        ['search', ':search'],
      ]);
    });

    const handler: RequestHandler = (_req, res, body) => res.sendJson(body);

    moxy.resetRoutes();
    moxy.on('/moxy.git/info/:refs', handler);
    await request.get('/moxy.git/info/refs?service=git-upload-pack').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { refs: 'refs', service: 'git-upload-pack' } });
    });

    moxy.resetRoutes();
    moxy.on('/moxy.git/info/:refs', handler);
    await request.get('/moxy.git/info/refs?service=git-upload-pack').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { refs: 'refs', service: 'git-upload-pack' } });
    });

    moxy.resetRoutes();
    moxy.on('/moxy.git/info/:refs\\?asdf=fdsa', handler);
    await request.get('/moxy.git/info/refs?service=git-upload-pack').expect(404);

    moxy.resetRoutes();
    moxy.on('/moxy.git/info/:refs\\?asdf=fdsa', handler);
    await request.get('/moxy.git/info/refs?asdf=git-upload-pack').expect(404);

    moxy.resetRoutes();
    moxy.on('/moxy.git/info/:refs\\?asdf=fdsa', handler);
    await request.get('/moxy.git/info/refs?asdf=xyz').expect(404);

    moxy.resetRoutes();
    moxy.on('/moxy.git/info/:refs\\?asdf=fdsa', handler);
    await request.get('/moxy.git/info/refs?asdf=fdsa').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { refs: 'refs', asdf: 'fdsa' } });
    });

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/moxy.git/info/refs?service=git-upload-pack').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/test-params').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/test-params?search').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/test-params?search=asdf').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/test-params/tpid').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/test-params/tpid?search').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId\\?search=:search', handler);
    await request.get('/test-params/tpid?search=asdf').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { tpId: 'tpid', search: 'asdf' } });
    });

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/moxy.git/info/refs?service=git-upload-pack').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/test-params').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/test-params?search').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/test-params?search=asdf').expect(404);

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/test-params/tpid').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { tpId: 'tpid' } });
    });

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/test-params/tpid?search').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { tpId: 'tpid', search: '' } });
    });

    moxy.resetRoutes();
    moxy.on('/test-params/:tpId', handler);
    await request.get('/test-params/tpid?search=asdf').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { tpId: 'tpid', search: 'asdf' } });
    });
  });

  await it('can disable regex route matching', async () => {
    await request.get('/route/:ignored/.*').expect(404);
    await request.post('/route/:ignored/.*').expect(404);
    await request.delete('/route/:ignored/.*').expect(404);

    await request.get('/route/ignored').expect(404);
    await request.get('/route/ignored/').expect(404);
    await request.get('/route/ignored/path').expect(404);
    await request.post('/route/ignored/path').expect(404);
    await request.delete('/route/ignored/path').expect(404);

    moxy.on('/route/:ignored/.*', {
      exact: true,
      all: (_req, res, vars) => res.sendJson(vars),
    });

    await request.get('/route/:ignored/.*').expect(200);
    await request.post('/route/:ignored/.*').expect(200);
    await request.delete('/route/:ignored/.*').expect(200);

    await request.get('/route/ignored').expect(404);
    await request.get('/route/ignored/').expect(404);
    await request.get('/route/ignored/path').expect(404);
    await request.post('/route/ignored/path').expect(404);
    await request.delete('/route/ignored/path').expect(404);

    moxy.resetRoutes();

    await request.get('/route/:ignored/.*').expect(404);
    await request.post('/route/:ignored/.*').expect(404);
    await request.delete('/route/:ignored/.*').expect(404);

    await request.get('/route/ignored/path').expect(404);
    await request.post('/route/ignored/path').expect(404);
    await request.delete('/route/ignored/path').expect(404);

    moxy.on('/route/:ignored/.*', {
      all: (_req, res, vars) => res.sendJson(vars),
    });

    await request.get('/route/:ignored/.*').expect(200);
    await request.post('/route/:ignored/.*').expect(200);
    await request.delete('/route/:ignored/.*').expect(200);

    await request.get('/route/ignored').expect(404);
    await request.get('/route/ignored/').expect(200);
    await request.get('/route/ignored/path').expect(200);
    await request.post('/route/ignored/path').expect(200);
    await request.delete('/route/ignored/path').expect(200);
  });

  await it('can modify server params from handler method', async () => {
    moxy.on('/modify-me', {
      get: (_req, res, _vars, server) => {
        server.once('/modify-me', {
          get: {
            status: 418,
            headers: { 'Content-Type': 'application/json' },
            body: { message: 'ok' },
          },
        });

        return res.sendJson({ message: 'configured' });
      },
    });

    await request.get('/modify-me').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { message: 'configured' } });
    });
    await request.get('/modify-me').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 418, body: { message: 'ok' } });
    });
    await request.get('/modify-me').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { message: 'configured' } });
    });
  });
}).catch(console.error);
