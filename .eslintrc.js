module.exports = {
  // Specifies the ESLint parser
  parser: '@typescript-eslint/parser',

  // Which files to not lint
  ignorePatterns: [
    'test/fixtures',
    'node_modules'
  ],

  parserOptions: {
    // Allows for the parsing of modern ECMAScript features
    ecmaVersion: 2020,
    // Allows for the use of imports
    sourceType: 'module',
  },

  plugins: ["mocha"],

  // The base rules this project extends from
  extends: [
    // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  // Rules in addition to the base
  rules: {
    // Eslint overrides
    'curly': ['error', 'all'],
    'quotes': ['error', 'single', { avoidEscape: true }],
    'max-lines-per-function': ['error', 60],

    // Typescript overrides
    // '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'off',
    "@typescript-eslint/explicit-function-return-type": ["error", { "allowExpressions": true }],
    '@typescript-eslint/no-unused-vars': [
      'error',
      { vars: 'all', args: 'none', ignoreRestSiblings: false },
    ],
  },
  overrides: [
    {
      files: ['**/*.spec.ts'],
      rules: {
        'max-lines-per-function': 'off',
        "mocha/no-exclusive-tests": "error",
      },
    },
  ],
};
