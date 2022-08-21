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

moxy.on('/query\\?search=:querySearch', {
  get: {
    status: 200,
    body: {
      youSearchedFor: ':querySearch'
    },
  }
});

moxy.on('/query(.*)', {
  get: (req, res, vars) => {
    console.log(vars);
    return res.sendJson({ status: 418, query: vars });
  }
});

moxy.listen(5000);

// curl localhost:5000/echo/bob
//   -> 200 {"hello":"bob"}

// curl localhost:5000/echo/bob/and/jane
//   -> 404

// curl localhost:5000/echo-with-slash/this/will/be/in/the/body
//   -> 200 {"hello":"this/will/be/in/the/body"}

// curl localhost:5000/query
//   -> {"status":418,"query":{}}

// curl 'localhost:5000/query?search=hello'
//   -> {"youSearchedFor":"hello"}

// curl 'localhost:5000/query?test=hello'
//   -> {"status":418,"query":{"test":"hello"}}
