#!/usr/bin/env node

import { realpathSync } from 'fs';
import { PathConfig } from './router';
import { MoxyServer, ServerConfig } from './server';
import { version } from '../package.json';

export interface CliConfig {
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
-v, --version             Show build version and exit.
-h, --help                Show this menu.
`;

export const assertNextArg = (name: string, argv: string[]): string => {
  const next = argv.shift();
  if (!next) {
    throw new Error(`${name} requires an argument`);
  }

  return next;
};

/* eslint-disable-next-line max-lines-per-function */
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

    case '-v':
    case '--version':
      process.stdout.write(`${version}\n`);
      process.exit(0);

    case '-r':
    case '--routes':
      config.routerFolders.push(
        ...assertNextArg(arg, argv)
          .split(',')
          .map((f) => realpathSync(f))
      );
      break;

    case '-o':
    case '--on':
      const next = assertNextArg(arg, argv);
      try {
        // fix for odd npx issue parsing json with literal newlines
        const newlineRemoved = next.replace(/([^\\])\\n/g, '$1');
        config.configs.push(JSON.parse(newlineRemoved) as { path: string; config: PathConfig });
      } catch (e) {
        throw new Error(`Error parsing --on argument: '${next}'\n${(e as Error)?.message}`);
      }
      break;

    case '-p':
    case '--port':
      config.port = assertNextArg(arg, argv);
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
    await moxyServer.addRoutesFromFolder(dir);
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
