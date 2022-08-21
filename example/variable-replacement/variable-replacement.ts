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
