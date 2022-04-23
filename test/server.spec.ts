import { expect } from 'chai';
import { after, afterEach, before } from 'mocha';
import { relative } from 'path';
import { default as supertest } from 'supertest';
import { MoxyServer, RouteConfig } from '../src';

const basicRouteConfig: RouteConfig = { post: { status: 418, body: { message: '0xC0FFEE' } } };
const updatedRouteConfig: RouteConfig = { delete: { status: 418, body: { message: '0xC0FFEE' } } };
const publicRouteResponse = {
  'GET /routes?once=false': 'show router routes',
  'POST /routes?once=false': 'create route',
  'PUT /routes/:route': 'create or update route',
  'PATCH /routes/:route': 'update route',
  'DELETE /routes/:route': 'delete route',
  'GET /router?once=false&serializeMethods=true': 'show router',
};
const privateRouteResponse = {
  'GET /routes?once=false': 'show router routes',
  'GET /router?once=false&serializeMethods=true': 'show router',
};

describe(relative(process.cwd(), __filename), () => {
  const moxy: MoxyServer = new MoxyServer({ router: { allowHttpRouteConfig: true }, logging: 'error' });
  let request: supertest.SuperTest<supertest.Test>;

  const clearRoutes = async (): Promise<void> => {
    moxy.resetRoutes();
    moxy.on('/brew', basicRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });
  };

  before(async () => {
    await moxy.listen();
    request = supertest(moxy.server);
  });

  afterEach(async () => {
    moxy.resetRoutes();
  });

  after(async () => {
    await moxy.close({ closeConnections: true });
  });

  it('GET /_moxy - reports api routes', async () => {
    await request.get('/_moxy').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(publicRouteResponse);
    });

    moxy.on('/a/b/c', { get: { status: 200 } });

    await request.get('/_moxy').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(publicRouteResponse);
    });
  });

  it('GET /_moxy/routes - can list available routes', async () => {
    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals([]);
    });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals([]);
      });

    moxy.on('/a/b/c', { get: { status: 200 } });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/a/b/c']);
    });

    moxy.on('test-two', { get: { status: 200 } });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/a/b/c', 'test-two']);
    });

    moxy.once('/x/y/z', { get: { status: 200 } });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals(['/x/y/z']);
      });

    moxy.once('test-three', { get: { status: 200 } });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals(['/x/y/z', 'test-three']);
      });
  });

  it('GET /_moxy/router - can return router config', async () => {
    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({});
    });

    moxy.on('/a/b/c', { get: { status: 200 } });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/a/b/c': { get: { status: 200 } } });
    });

    moxy.on('test-two', { get: { status: 200 } });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({
        '/a/b/c': { get: { status: 200 } },
        'test-two': { get: { status: 200 } },
      });
    });

    moxy.on('test', {
      get(req, res) {
        return res.writeHead(200, 'ok');
      },
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({
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
      });
    });

    await request
      .get('/_moxy/router')
      .query({ serializeMethods: false })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({
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
        });
      });
  });

  it('POST /_moxy/routes - can create routes', async () => {
    // programatic
    moxy.on('/brew', basicRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': basicRouteConfig });
    });

    moxy.once('/brew', updatedRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': basicRouteConfig });
    });

    moxy.resetRoutes();

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals([]);
    });

    // http
    await request
      .post('/_moxy/routes')
      .send({
        path: '/brew',
        config: basicRouteConfig,
      })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({ '/brew': basicRouteConfig });
      });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': basicRouteConfig });
    });

    await request
      .post('/_moxy/routes')
      .query({ once: true })
      .send({
        path: '/brew',
        config: { get: basicRouteConfig.post },
      })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({ '/brew': { get: basicRouteConfig.post } });
      });

    await request
      .get('/_moxy/routes')
      .query({ once: true })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals(['/brew']);
      });

    await request
      .get('/_moxy/router')
      .query({ once: true })
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({ '/brew': { get: basicRouteConfig.post } });
      });
  });

  it('PUT /_moxy/routes/:route - can create or replace a route', async () => {
    // programatic
    await clearRoutes();

    moxy.off('/brew');
    moxy.on('/brew', updatedRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': updatedRouteConfig });
    });

    // http
    await clearRoutes();

    await request
      .put('/_moxy/routes/brew')
      .send(updatedRouteConfig)
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({ '/brew': updatedRouteConfig });
      });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': updatedRouteConfig });
    });
  });

  it('PATCH /_moxy/routes/:route - can update a route', async () => {
    // programatic
    await clearRoutes();

    moxy.on('/brew', updatedRouteConfig);

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': { ...basicRouteConfig, ...updatedRouteConfig } });
    });

    // http
    moxy.resetRoutes();

    await request
      .patch('/_moxy/routes/brew')
      .send(basicRouteConfig)
      .expect(({ status }) => {
        expect(status).equals(404);
      });

    await clearRoutes();

    await request
      .patch('/_moxy/routes/brew')
      .send(updatedRouteConfig)
      .expect(({ status, body }) => {
        expect(status).equals(200);
        expect(body).deep.equals({ '/brew': { ...basicRouteConfig, ...updatedRouteConfig } });
      });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/brew']);
    });

    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/brew': { ...basicRouteConfig, ...updatedRouteConfig } });
    });
  });

  it('DELETE /_moxy/routes/:route - can remove routes', async () => {
    // programatic
    await clearRoutes();

    moxy.off('/brew');

    expect(moxy.router.routes).deep.equals({});

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals([]);
    });

    // http
    await clearRoutes();

    await request.delete('/_moxy/routes/brew').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ message: 'Ok' });
    });

    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals([]);
    });
  });

  it('disables http modification by default', async () => {
    const nonExposedServer = new MoxyServer({ logging: 'error', router: { allowHttpRouteConfig: false } });
    await nonExposedServer.listen(0);
    after(async () => await nonExposedServer.close({ closeConnections: true }));

    request = supertest(nonExposedServer.server);

    // programatic ok
    nonExposedServer.on('/private-router', { get: { status: 200 } });

    // root available
    await request.get('/_moxy').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(privateRouteResponse);
    });

    // routes available
    await request.get('/_moxy/routes').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals(['/private-router']);
    });

    // routes available
    await request.get('/_moxy/router').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({ '/private-router': { get: { status: 200 } } });
    });

    // all others are blocked
    await request.post('/_moxy/routes').expect(404);
    await request.put('/_moxy/routes/private-router').expect(404);
    await request.patch('/_moxy/routes/private-router').expect(404);
    await request.delete('/_moxy/routes/private-router').expect(404);
  });
});
