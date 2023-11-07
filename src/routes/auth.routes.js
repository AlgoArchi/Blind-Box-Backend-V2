const authCtrls = require('~/controllers/auth.controllers');
const { validate } = require('~/lib/ajv');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/auth',
  routes: [
    {
      path: '/connect',
      methods: {
        post: {
          middlewares: [authCtrls.connnectWallet],
        },
      },
    },
  ],
};
