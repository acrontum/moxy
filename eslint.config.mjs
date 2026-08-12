// eslint.config.js or eslint.config.mjs for compat
import { default as acrLint } from '@acrontum/eslint-config';

export default [
  { ignores: ['test/fixtures', '**/node_modules', 'dist/'] },
  ...acrLint,
  {
    files: ['src/cli.ts', 'src/util/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
