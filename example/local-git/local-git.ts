import { HandlerVariables, MoxyRequest, MoxyResponse, MoxyServer } from '@acrontum/moxy';
import { exec, spawn } from 'child_process';
import { existsSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { Readable } from 'stream';
import { promisify } from 'util';

const moxy = new MoxyServer();

const run = promisify(exec);

const pack = (service: string) => {
  const name = `# service=${service}\n`;
  const len = (4 + name.length).toString(16);

  return `${Array(4 - len.length + 1).join('0')}${len}${name}0000`;
};

const getRepo = (repoName: string) => join('./repos', repoName.replace('.git', ''));

moxy.on('/projects/:repo/info/refs\\?service=:service', {
  get: async (req: MoxyRequest, res: MoxyResponse, vars: HandlerVariables): Promise<MoxyResponse> => {
    const repo = getRepo(vars.repo as string);
    const service = vars.service as string;

    if (!existsSync(repo)) {
      return res.sendJson({ status: 404, body: 'Not found', vars });
    }

    try {
      if (!existsSync(join(repo, '.git'))) {
        await run(`git init -q && git add -A && git commit -am init`, { cwd: repo });
      } else {
        await run(`git add -A && git commit -am init || echo 'up to date'`, { cwd: repo });
      }

      res.writeHead(200, {
        'Content-Type': `application/x-${service}-advertisement`,
        'Cache-Control': 'no-cache',
      });
      res.write(pack(service));

      const uploadPack = spawn(service, ['--stateless-rpc', '--advertise-refs', repo]);

      return uploadPack.stdout.pipe(res);
    } catch (e) {
      console.error(e);
    }

    return res.sendJson({ status: 404, body: 'Not found', vars });
  },
});

moxy.on('/projects/:repo/git-upload-pack', {
  post: async (req: MoxyRequest, res: MoxyResponse, vars: HandlerVariables): Promise<MoxyResponse> => {
    const repo = getRepo(vars.repo as string);

    if (!existsSync(repo)) {
      return res.sendJson({ status: 404, body: 'Not found', vars });
    }

    try {
      res.writeHead(200, {
        'Content-Type': 'application/x-git-upload-pack-response',
        'Cache-Control': 'no-cache',
      });

      const proc = spawn(`git-upload-pack`, ['--stateless-rpc', repo]);

      const stream = new Readable();
      stream.push(await req.body);
      stream.push(null);

      stream.pipe(proc.stdin);

      proc.stdout.on('end', () => rm(join(repo, '.git'), { recursive: true }).catch(console.error));

      return proc.stdout.pipe(res);
    } catch (e) {
      console.error(e);
    }

    return res.sendJson({ status: 404, body: 'Not found', vars });
  },
});

moxy.listen(5000);

/*
git clone http://localhost:5000/projects/server.git
git clone http://localhost:5000/projects/app
*/
