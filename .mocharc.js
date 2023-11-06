'use strict';

const IS_WATCH = process.env.WATCH === 'true';
const IS_DEBUG = process.env.DEBUG === 'true';

process.env.API_EXCLUDES = false;

module.exports = {
  ui: 'tdd',
  diff: true,
  timeout: '15s',
  exit: !IS_WATCH,
  watch: IS_WATCH,
  reporter: 'spec',
  enableTimeouts: false,
  'inspect-brk': IS_DEBUG,
  package: './package.json',
  extension: ['js', 'cjs', 'mjs'],
  'watch-files': ['./src/**/*.test.js'],
  spec: ['./__tests__/test-hooks.js', './src/**/*.test.js'],
};
