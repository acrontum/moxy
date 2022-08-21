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
