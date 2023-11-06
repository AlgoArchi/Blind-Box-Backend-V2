/* eslint-disable no-console, import/no-extraneous-dependencies */
require('module-alias/register');
const swaggerJsdoc = require('swagger-jsdoc');
const { sync } = require('glob');
const { resolve } = require('node:path');
const { readFileSync, writeFileSync, rmSync, mkdirSync } = require('node:fs');
const YAML = require('yaml');

const { apiPrefix } = require('~/config/index');
const { get } = require('~/config/tools');
const pkg = require('../package.json');

// Remove old temporary folder
rmSync(resolve(__dirname, '.cache'), { recursive: true, force: true });
// Create empty cache folder
mkdirSync(resolve(__dirname, '.cache'));

function capitalize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/[\s-_.]/g, '');
}

sync('src/**/*.schema.json').forEach((path) => {
  const regex = /(?<name>([^/]*))\.json$/;
  const exec = regex.exec(path);

  if (!exec) {
    console.error('error', 'file not captured', path);
    return;
  }

  const { name } = exec.groups;
  const content = readFileSync(path, { encoding: 'utf-8' });
  const json = JSON.parse(content);
  const yaml = YAML.stringify({
    components: {
      schemas: {
        [capitalize(name)]: json,
      },
    },
  });
  writeFileSync(resolve(__dirname, '.cache', `${name}.schema.yaml`), yaml);
});

/**
 * @type {import('swagger-jsdoc').Options}
 */
const options = {
  definition: {
    openapi: '3.0.0',
    servers: get('SWAGGER_SERVERS')
      .split(',')
      .map((url) => ({
        url: `${url}${apiPrefix}`,
      })),
    info: {
      title: pkg.description,
      version: pkg.version,
    },
  },
  apis: ['src/routes/*.routes.js', 'scripts/assets/swagger/*.yaml', 'scripts/.cache/*.schema.yaml'],
};

const openapiSpecification = swaggerJsdoc(options);
console.log(JSON.stringify(openapiSpecification, null, 2));

// Cleanup
rmSync(resolve(__dirname, '.cache'), { recursive: true, force: true });
