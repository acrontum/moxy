#!/usr/bin/env node

import { realpathSync } from 'fs';
import { MoxyServer, ServerConfig } from './lib';

const options: ServerConfig = { logging: 'verbose', router: {} };
const routerFolders: string[] = [];
let port: string = process.env.PORT || '0';

const usage = `\
Start a mocking server

options:
-r, --route FOLDER      Add routes from FOLDER. Can be called multiple times,
                        FOLDER can be multiple separated by comma (,).
-p, --port PORT         Run on port PORT. If none specified, will find an
                        avaiable port.
-q, --quiet             Decrease log verbosity.
-a, --allowHttpConfig   Allow routes config via HTTP methods. Default false.
-h, --help              Show this menu.
`;

export const getOption = (argv?: string[]): number => {
  if (!argv?.length) {
    return 0;
  }

  const arg = argv.shift();

  switch (arg) {
    case '--':
      return 0;
    case '-h':
    case '--help':
      process.stdout.write(usage);
      process.exit(0);

    case '-r':
    case '--route':
      routerFolders.push(
        ...argv
          .shift()
          .split(',')
          .map((f) => realpathSync(f))
      );
      break;

    case '-p':
    case '--port':
      port = argv.shift();
      break;

    case '-q':
    case '--quiet':
      options.logging = 'error';
      break;

    case '-a':
    case '--allowHttpRouteConfig':
      options.router.allowHttpRouteConfig = true;
      break;

    default:
      throw new Error(`Unknown option -- ${arg}\n${usage}`);
  }

  return argv.length;
};

export const main = async (argv?: string[]): Promise<MoxyServer> => {
  while (getOption(argv)) {}

  const parsedPort = parseInt(port, 10);
  if (Number.isNaN(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
    throw new Error(`Error: invalid port ${port}\n`);
  }

  const moxyServer = new MoxyServer(options);

  for (const dir of routerFolders) {
    await moxyServer.router.addRoutesFromFolder(dir);
  }

  await moxyServer.listen(parsedPort);

  return moxyServer;
};

if (require.main === module) {
  main(process.argv.slice(2)).catch((error: Error) => {
    process.stderr.write((error as Error).message);
    process.exit(1);
  });
}
