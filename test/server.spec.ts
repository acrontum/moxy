import assert from 'node:assert';
import { relative } from 'node:path';
import { after, afterEach, before, describe, it } from 'node:test';
import { MoxyServer, RouteConfig } from '../src';
import { getRequest, TestRequest } from './shared/test-util';

const basicRouteConfig: RouteConfig = { post: { status: 418, body: { message: '0xC0FFEE' } } };
const updatedRouteConfig: RouteConfig = { delete: { status: 418, body: { message: '0xC0FFEE' } } };
const publicRouteResponse = {
  'GET /routes?once=false': 'show router routes',
  'POST /routes?once=false': 'create route',
  'PUT /routes/:route': 'create or replace route',
  'PATCH /routes/:route': 'update route',
  'DELETE /routes/:route': 'delete route',
  'GET /router?once=false&serializeMethods=true': 'show router',
};
const privateRouteResponse = {
  'GET /routes?once=false': 'show router routes',
  'GET /router?once=false&serializeMethods=true': 'show router',
};

describe(relative(process.cwd(), __filename), async () => {
  const moxy: MoxyServer = new MoxyServer({ router: { allowHttpRouteConfig: true }, logging: 'error' });
  let request: TestRequest;

  const clearRoutes = async (): Promise<void> => {
    moxy.resetRoutes();
    moxy.on('/brew', basicRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });
  };

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

  await it('GET /_moxy - reports api routes', async () => {
    await request.get('/_moxy').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: publicRouteResponse });
    });

    moxy.on('/a/b/c', { get: { status: 200 } });

    await request.get('/_moxy').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: publicRouteResponse });
    });
  });

  await it('GET /_moxy/routes - can list available routes', async () => {
    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
    });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
      });

    moxy.on('/a/b/c', { get: { status: 200 } });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/a/b/c'] });
    });

    moxy.on('test-two', { get: { status: 200 } });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/a/b/c', 'test-two'] });
    });

    moxy.once('/x/y/z', { get: { status: 200 } });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: ['/x/y/z'] });
      });

    moxy.once('test-three', { get: { status: 200 } });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: ['/x/y/z', 'test-three'] });
      });
  });

  await it('GET /_moxy/router - can return router config', async () => {
    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: {} });
    });

    moxy.on('/a/b/c', { get: { status: 200 } });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/a/b/c': { get: { status: 200 } } } });
    });

    moxy.on('test-two', { get: { status: 200 } });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual(
        { status, body },
        {
          status: 200,
          body: {
            '/a/b/c': { get: { status: 200 } },
            'test-two': { get: { status: 200 } },
          },
        },
      );
    });

    moxy.on('test', {
      get(req, res) {
        return res.writeHead(200, 'ok');
      },
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual(
        { status, body },
        {
          status: 200,
          body: {
            '/a/b/c': {
              get: {
                status: 200,
              },
            },
            'test-two': {
              get: {
                status: 200,
              },
            },
            'test': {
              get: "get(req, res) {\n                return res.writeHead(200, 'ok');\n            }",
            },
          },
        },
      );
    });

    await request
      .get('/_moxy/router')
      .query({ serializeMethods: false })
      .expect(({ status, body }) => {
        assert.deepStrictEqual(
          { status, body },
          {
            status: 200,
            body: {
              '/a/b/c': {
                get: {
                  status: 200,
                },
              },
              'test-two': {
                get: {
                  status: 200,
                },
              },
              'test': {
                get: '[Function: handler]',
              },
            },
          },
        );
      });
  });

  await it('POST /_moxy/routes - can create routes', async () => {
    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
    });

    // programatic
    moxy.on('/brew', basicRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': basicRouteConfig } });
    });

    moxy.once('/brew', updatedRouteConfig);

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
      });

    await request
      .get('/_moxy/router')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': updatedRouteConfig } });
      });

    moxy.resetRoutes();

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
    });

    // http
    await request
      .post('/_moxy/routes')
      .send({
        path: '/brew',
        config: basicRouteConfig,
      })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 201, body: { '/brew': basicRouteConfig } });
      });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': basicRouteConfig } });
    });

    await request
      .post('/_moxy/routes')
      .query({ once: true })
      .send({
        path: '/brew',
        config: { get: basicRouteConfig.post },
      })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 201, body: { '/brew': { get: basicRouteConfig.post } } });
      });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
      });

    await request
      .get('/_moxy/router')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': { get: basicRouteConfig.post } } });
      });

    moxy.resetRoutes();

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
    });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
      });

    // programatic
    moxy.on('/brew/:file', '/data/:file');

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew/:file'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew/:file': { get: '/data/:file' } } });
    });

    moxy.once('/brew/:file', '/www-data/:file');

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew/:file'] });
      });

    await request
      .get('/_moxy/router')
      .query({ once: true })
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew/:file': { get: '/www-data/:file' } } });
      });

    // http
  });

  await it('PUT /_moxy/routes/:route - can create or replace a route', async () => {
    // programatic
    await clearRoutes();

    moxy.off('/brew');
    moxy.on('/brew', updatedRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': updatedRouteConfig } });
    });

    // http
    await clearRoutes();

    await request
      .put('/_moxy/routes/brew')
      .send(updatedRouteConfig)
      .expect(({ status, body }) => {
        assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': updatedRouteConfig } });
      });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/brew': updatedRouteConfig } });
    });
  });

  await it('PATCH /_moxy/routes/:route - can update a route', async () => {
    // programatic
    await clearRoutes();

    moxy.on('/brew', updatedRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual(
        { status, body },
        { status: 200, body: { '/brew': { ...basicRouteConfig, ...updatedRouteConfig } } },
      );
    });

    // http
    moxy.resetRoutes();

    await request.patch('/_moxy/routes/brew').send(basicRouteConfig).expect(404);

    await clearRoutes();

    await request
      .patch('/_moxy/routes/brew')
      .send(updatedRouteConfig)
      .expect(({ status, body }) => {
        assert.deepStrictEqual(
          { status, body },
          { status: 200, body: { '/brew': { ...basicRouteConfig, ...updatedRouteConfig } } },
        );
      });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/brew'] });
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual(
        { status, body },
        { status: 200, body: { '/brew': { ...basicRouteConfig, ...updatedRouteConfig } } },
      );
    });
  });

  await it('DELETE /_moxy/routes/:route - can remove routes', async () => {
    // programatic
    await clearRoutes();

    moxy.off('/brew');

    assert.deepStrictEqual(moxy.router.routes, {});

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
    });

    // http
    await clearRoutes();

    await request.delete('/_moxy/routes/brew').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { message: 'Ok' } });
    });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: [] });
    });
  });

  await it('disables http modification by default', async () => {
    const nonExposedServer = new MoxyServer({ logging: 'error', router: { allowHttpRouteConfig: false } });
    await nonExposedServer.listen(0);
    after(async () => {
      await nonExposedServer.close({ closeConnections: true });
    });

    request = getRequest(nonExposedServer);

    // programatic ok
    nonExposedServer.on('/private-router', { get: { status: 200 } });

    // root available
    await request.get('/_moxy').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: privateRouteResponse });
    });

    // routes available
    await request.get('/_moxy/routes').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: ['/private-router'] });
    });

    // routes available
    await request.get('/_moxy/router').expect(({ status, body }) => {
      assert.deepStrictEqual({ status, body }, { status: 200, body: { '/private-router': { get: { status: 200 } } } });
    });

    // all others are blocked
    await request.post('/_moxy/routes').expect(404);
    await request.put('/_moxy/routes/private-router').expect(404);
    await request.patch('/_moxy/routes/private-router').expect(404);
    await request.delete('/_moxy/routes/private-router').expect(404);
  });
}).catch(console.error);
