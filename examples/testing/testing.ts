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
