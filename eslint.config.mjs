// eslint.config.js or eslint.config.mjs for compat
import { default as acrLint } from '@acrontum/eslint-config';

export default [
  { ignores: ['test/fixtures', '**/node_modules', 'dist/'] },
  {
    files: ['**/*.spec.ts'],
    rules: {
      'max-lines-per-function': 'off',
    },
  },
  ...acrLint,
  {
    files: ['src/cli.ts', 'src/util/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowBoolean: true, allowNumber: true,  }],
    },
  },
];
