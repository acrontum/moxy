#!/usr/bin/env node

import { realpathSync } from 'fs';
import { PathConfig } from './router';
import { MoxyServer, ServerConfig } from './server';

interface CliConfig {
  options: ServerConfig;
  routerFolders: string[];
  port: string;
  configs: { path: string; config: PathConfig }[];
}

const usage = `\
Start a mocking server

options:
-r, --routes FOLDER       Add routes from FOLDER. Can be called multiple times,
                          FOLDER can be multiple separated by comma (,).
-p, --port PORT           Run on port PORT. If none specified, will find an
                          avaiable port.
-o, --on CONFIG           Add json CONFIG to routes.
-q, --quiet               Decrease log verbosity.
-a, --allow-http-config   Allow routes config via HTTP methods. Default false.
-h, --help                Show this menu.
`;

export const assertNextArg = (name: string, argv: string[]): string => {
  const next = argv.shift();
  if (!next) {
    throw new Error(`${name} requires an argument`);
  }

  return next;
};

export const getOption = (config: CliConfig, argv?: string[]): number => {
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
    case '--routes':
      config.routerFolders.push(
        ...assertNextArg('--routes', argv)
          .split(',')
          .map((f) => realpathSync(f))
      );
      break;

    case '-o':
    case '--on':
      const next = assertNextArg('--on', argv);
      try {
        config.configs.push(JSON.parse(next) as { path: string; config: PathConfig });
      } catch (e) {
        throw new Error(`Invalid --on argument: '${next}'`);
      }
      break;

    case '-p':
    case '--port':
      config.port = assertNextArg('--port', argv);
      break;

    case '-q':
    case '--quiet':
      config.options.logging = 'error';
      break;

    case '-a':
    case '--allow-http-config':
      config.options.router.allowHttpRouteConfig = true;
      break;

    default:
      throw new Error(`Unknown option -- ${arg}\n${usage}`);
  }

  return argv.length;
};

export const main = async (argv?: string[]): Promise<MoxyServer> => {
  const cliConfig: CliConfig = {
    options: { logging: 'verbose', router: {} },
    routerFolders: [],
    port: process.env.PORT || '0',
    configs: [],
  };

  while (getOption(cliConfig, argv)) {}

  const parsedPort = parseInt(cliConfig.port, 10);
  if (Number.isNaN(parsedPort) || parsedPort < 0 || parsedPort > 65535) {
    throw new Error(`Error: invalid port ${cliConfig.port}\n`);
  }

  const moxyServer = new MoxyServer(cliConfig.options);

  for (const dir of cliConfig.routerFolders) {
    await moxyServer.router.addRoutesFromFolder(dir);
  }

  for (const conf of cliConfig.configs) {
    moxyServer.on(conf.path, conf.config);
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
