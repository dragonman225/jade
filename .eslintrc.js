// Useful references:
// https://www.npmjs.com/package/eslint-config-react-app
// https://github.com/facebook/create-react-app/blob/master/packages/eslint-config-react-app/index.js
// https://medium.com/@dors718/linting-your-react-typescript-project-with-eslint-and-prettier-2423170c3d42

const path = require('path')

module.exports = {
  root: true, // Prevent looking for config all the way up in parent directories
  env: { // Enable environment-specific global variables
    browser: true,
    commonjs: true,
    es6: true,
    node: true
  },
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    },
    project: path.resolve(__dirname, 'tsconfig.json'),
    sourceType: 'module', // Allows for the use of imports
    tsconfigRootDir: __dirname
  },
  plugins: [
    'react',
    '@typescript-eslint'
  ],
  extends: [
    // See https://www.npmjs.com/package/@typescript-eslint/eslint-plugin#recommended-configs
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    // Uses the recommended rules from @eslint-plugin-react
    'plugin:react/recommended'
  ],
  rules: {
    'arrow-spacing': [
      'error',
      { before: true, after: true }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'max-len': [
      'warn',
      { code: 80, tabWidth: 2 }
    ],
    'no-console': 'off',
    'quotes': [
      'error',
      'single'
    ],
    'semi': 'off', // note you must disable the base rule as it can report incorrect errors
    '@typescript-eslint/semi': [
      'error',
      'never'
    ],
    'indent': 'off',
    '@typescript-eslint/indent': [
      'error',
      2,
      { 'SwitchCase': 1 }
    ],
    '@typescript-eslint/no-use-before-define': [
      'error',
      { 'functions': false, 'classes': true }
    ],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        'multiline': {
          'delimiter': 'none',
          'requireLast': false
        },
        'singleline': {
          'delimiter': 'semi',
          'requireLast': false
        }
      }
    ],
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': 'off',

    // These rules don't add much value, are better covered by TypeScript and good definition files
    'react/no-direct-mutation-state': 'off',
    'react/no-deprecated': 'off',
    'react/no-string-refs': 'off',
    'react/require-render-return': 'off',

    // we want to check ".tsx" files
    'react/jsx-filename-extension': [
      'warn',
      { extensions: ['.jsx', '.tsx'] }
    ],
    'react/prop-types': 'off', // Is this incompatible with TS props type?
  },
  overrides: [
    {
      'files': [
        '*.json'
      ],
      'rules': {
        'quotes': 'off'
      }
    }
  ],
  settings: {
    react: {
      version: 'detect' // Tells eslint-plugin-react to automatically detect the version of React to use
    }
  }
}
