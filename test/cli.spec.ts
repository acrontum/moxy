import { expect, use } from 'chai';
import { default as chaiPromise } from 'chai-as-promised';
import { afterEach } from 'mocha';
import { join, relative } from 'path';
import { default as supertest } from 'supertest';
import { formatRoutesForPrinting, main, MoxyServer, RouteConfig } from '../src';

use(chaiPromise);

describe(relative(process.cwd(), __filename), () => {
  let moxy: MoxyServer;
  let request: supertest.SuperTest<supertest.Test>;

  const start = async (argv: string[], assertions: (moxy: MoxyServer) => any): Promise<void> => {
    moxy = await main(argv);
    await assertions(moxy);
    await moxy.close({ closeConnections: true });
  };

  afterEach(async () => {
    await moxy?.close?.({ closeConnections: true });
  });

  it('can start a server', async () => {
    const oldLog = process.env.MOXY_LOG;
    process.env.MOXY_LOG = 'error';

    moxy = await main();

    process.env.MOXY_LOG = oldLog;
    if (!oldLog) {
      delete process.env.MOXY_LOG;
    }

    request = supertest(moxy.server);
    await request.get('/_moxy').expect(({ status, body }) => {
      expect(status).equals(200);
      expect(body).deep.equals({
        'GET /routes?once=false': 'show router routes',
        'GET /router?once=false&serializeMethods=true': 'show router',
      });
    });

    await moxy.close({ closeConnections: true });

    await start(['-q'], (server) => {
      expect(server.logLevel).equals('error');
    });

    await start(['--quiet'], (server) => {
      expect(server.logLevel).equals('error');
    });

    await start(['--quiet', '-q'], (server) => {
      expect(server.logLevel).equals('error');
    });

    await start(['-q', '-p', '8521', '--port', '8521', '-a', '--allow-http-config'], (server) => {
      expect(server.port).equals(8521);
      expect(server.router.options.allowHttpRouteConfig).equals(true);
    });

    await expect(main(['-p', 'a1'])).is.rejectedWith('Error: invalid port a1');
  });

  it('can load routes on config', async () => {
    const routes = join(__dirname, 'fixtures', 'load-from-dir');
    const serializedDeleteFuntion =
      "delete(req, res) {\n            return res.writeHead(301, 'google.ca');\n        }";

    await start(['-q', '-r', routes], (server) => {
      const routerConfig = JSON.parse(formatRoutesForPrinting(server.router.routes));

      expect(routerConfig).deep.equals({
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

    await start(['-q', '--routes', routes], (server) => {
      const routerConfig = JSON.parse(formatRoutesForPrinting(server.router.routes));

      expect(routerConfig).deep.equals({
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

    await start(['-q', '--routes', routes, '--routes', routes], (server) => {
      const routerConfig = JSON.parse(formatRoutesForPrinting(server.router.routes));

      expect(routerConfig).deep.equals({
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

    const onFirstTest = JSON.stringify({
      path: '/test/this/path',
      config: {
        get: { status: 503 },
      } as RouteConfig,
    });

    await start(['-q', '-o', onFirstTest], (server) => {
      expect(server.router.routes).deep.equals({
        '/test/this/path': { get: { status: 503 }, urlRegex: /^\/test\/this\/path(\?.*)?$/g },
      });
    });

    const onSecondTest = JSON.stringify({
      path: '/some/other/path',
      config: {
        get: { status: 503 },
      } as RouteConfig,
    });

    const onSecondTestPartTwo = JSON.stringify({
      path: '/some/other/path',
      config: {
        post: { status: 101 },
      } as RouteConfig,
    });

    await start(['-q', '-o', onFirstTest, '--on', onSecondTest, '-o', onSecondTestPartTwo], (server) => {
      expect(server.router.routes).deep.equals({
        '/test/this/path': { get: { status: 503 }, urlRegex: /^\/test\/this\/path(\?.*)?$/g },
        '/some/other/path': {
          get: { status: 503 },
          urlRegex: /^\/some\/other\/path(\?.*)?$/g,
          post: { status: 101 },
        },
      });
    });
  });
});
