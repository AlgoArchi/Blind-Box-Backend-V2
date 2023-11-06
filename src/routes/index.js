/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const express = require('express');
const chalk = require('chalk');
const { sync } = require('glob');
const log = require('debug')('app:routes');
const { resolve, relative } = require('node:path');

// const authController = require('~/controllers/auth.controllers');
const { apiPrefix, apiExcludes } = require('~/config/index');
const { loadUser, setDefaultMime } = require('~/controllers/common.controllers');

const router = express.Router();

router.use(setDefaultMime);
router.use(loadUser);

sync(resolve(__dirname, '*.routes.js').replaceAll('\\', '/')).forEach((routePath) => {
  /**
   * @type {Routes.default}
   */
  const m = require(resolve(routePath));
  const r = express.Router();
  const rPath = m.is_global === true ? m.prefix : `${apiPrefix}${m.prefix}`;

  if (apiExcludes && m.exclude) {
    log('Excluding the module', relative('.', routePath));
    return;
  }

  // Add the before middlewares
  if (Array.isArray(m.before)) {
    m.before.forEach((middleware) => {
      r.use(middleware);
    });
  }

  // Parse the routes
  if (Array.isArray(m.routes)) {
    m.routes.forEach((route) => {
      if (
        !route ||
        typeof route !== 'object' ||
        !route.methods ||
        typeof route.methods !== 'object' ||
        !route.path
      ) {
        console.warn('Invalid route', route);
        return;
      }

      if (apiExcludes && route.exclude) {
        log('Excluding the route "%s"', `${rPath}${route.path}`);
        return;
      }

      let routeTmp = r.route(route.path);
      let allMiddlwares = route.all || route['*'];

      if (allMiddlwares && !Array.isArray(allMiddlwares)) {
        allMiddlwares = [allMiddlwares];
      }

      if (!Array.isArray(allMiddlwares)) {
        allMiddlwares = [];
      }

      // const { groups: { name } } = /(?<name>([^/]*))\.routes\.js$/.exec(routePath);
      // console.log(`[${name.toUpperCase()}] ${route.path}`);

      // Add 'all' middlewares
      routeTmp = routeTmp.all(allMiddlwares);

      // Scan the routes
      Object.keys(route.methods).forEach(async (k) => {
        if (
          typeof routeTmp[k] === 'function' &&
          Object.prototype.hasOwnProperty.call(route.methods, k) &&
          route.methods[k] &&
          typeof route.methods[k] === 'object' &&
          route.methods[k].middlewares
        ) {
          /**
           * @type {Routes.Method}
           */
          const method = route.methods[k];

          if (apiExcludes && method.exclude) {
            log('Excluding the method "[%s] %s"', k.toUpperCase(), `${rPath}${route.path}`);
            return;
          }

          try {
            routeTmp[k](method.middlewares);
          } catch (e) {
            const routes = method.middlewares.map((middleware) => {
              const result = typeof middleware === 'function' ? '⨍' : 'null';
              return result;
            });
            log(
              'error',
              `
Error while adding route:

${chalk.red('Route')}   : ${route.path}
${chalk.red('Module')}  : ${routePath}
${chalk.red('Method')}  : ${k}
${chalk.red('Routes')}  : [${routes.join(' , ')}]

Please check your IAM configuraion
`,
            );
            process.exit(1);
          }
        }
      });
    });
  }

  // Add the params middlewares
  if (Array.isArray(m.params)) {
    m.params.forEach((p) => {
      r.param(p.name, p.middleware);
    });
  }

  // Add the after middlewares
  if (Array.isArray(m.after)) {
    m.after.forEach((middleware) => {
      r.use(middleware);
    });
  }

  // Add the router to the app with the prefix
  router.use(rPath, r);
});

module.exports = router;
