import { MoxyServer, MoxyRequest, MoxyResponse, HandlerVariables } from '@acrontum/moxy';
import { createWriteStream, promises } from 'fs';
import { join, dirname, resolve } from 'path';

const moxy = new MoxyServer();

// simple file server (GET only, no nested paths)

// NOTE moxy will not accept paths outside of the target assets folder by default
// such as /home/file.png or ../../file.png. To disable this behaviour, use a
// request handler
moxy.on('/v1/assets/:filename', './assets/:filename');

// file server with upload
moxy.on('/v1/database/(?<filename>.+)', {
  get: './disk-db/:filename',
  put: async (req: MoxyRequest, res: MoxyResponse, vars: HandlerVariables) => {
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
curl localhost:5000/v1/assets/hello.html
#  -> 404

curl localhost:5000/v1/assets/welcome.txt
#  -> 200 hello world!

curl localhost:5000/v1/database/secrets/passwords.txt
#  -> 404

curl -XPUT localhost:5000/v1/database/secrets/passwords.txt -d 'admin=super-secret'
#  -> 201

curl localhost:5000/v1/database/secrets/passwords.txt
#  -> 200 admin=super-secret
*/
