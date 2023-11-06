module.exports = {
  extends: ['airbnb-base', 'prettier'],
  globals: {},
  rules: {
    indent: 2,
    semi: ['error', 'always'],
    'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
    'linebreak-style': ['error', 'unix'],
    quotes: [2, 'single', { avoidEscape: true }],
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-restricted-syntax': ['error', 'WithStatement', "BinaryExpression[operator='in']"],
    camelcase: 'off',
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        exports: 'always-multiline',
        functions: 'always-multiline',
      },
    ],
    'max-len': [
      'error',
      {
        code: 100,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['~', './src']],
        extensions: ['.js', '.json'],
      },
    },
  },
};
