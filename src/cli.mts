import { fileURLToPath } from 'url';
import { main } from './cli.js';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
