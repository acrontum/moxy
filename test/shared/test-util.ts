import { CallbackHandler, default as supertest } from 'supertest';
import { default as TestAgent } from 'supertest/lib/agent';
import { MoxyHttpServer, MoxyServer } from '../../src';
import assert from 'node:assert';

interface SuperTestResponse<T = unknown> extends supertest.Response {
  body: T;
}

interface SuperTestAgent extends supertest.Test {
  /** @deprecated: supertest .expect does not accept / wait for async - use .then */
  expect<T = unknown>(checker: (res: SuperTestResponse<T>) => PromiseLike<unknown>, callback?: CallbackHandler): never;
  expect<T = unknown>(checker: (res: SuperTestResponse<T>) => void, callback?: CallbackHandler): this;
  expect(statusOrBody: number | string | RegExp | object, callback?: CallbackHandler): this;
  expect(status: number, body: unknown, callback?: CallbackHandler): this;
  expect(field: string, val: string | RegExp, callback?: CallbackHandler): this;
  then<Body = unknown, Resolve = unknown, Reject = never>(
    onfulfilled?: (value: SuperTestResponse<Body>) => Resolve | PromiseLike<Resolve>,
    onrejected?: (reason: unknown) => Reject | PromiseLike<Reject>,
  ): Promise<Resolve | Reject>;
  /* eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters */
  query<T = unknown>(val: T | string): this;
}

export type TestRequest = TestAgent<SuperTestAgent>;

export const getRequest = (moxy: MoxyServer): TestRequest => {
  assert.strictEqual(typeof moxy.server !== 'undefined', true);
  const request = supertest.agent(moxy.server as MoxyHttpServer) as TestRequest;

  return request;
};
