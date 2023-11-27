const walletController = require('~/controllers/wallet.controllers');
const commonCtrls = require('~/controllers/common.controllers');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/wallet',
  routes: [
    {
      path: '/',
      methods: {
        get: {
          middlewares: [commonCtrls.isAuthenticated, walletController.getWalletBalance],
        },
      },
    },
    {
      path: '/deposit',
      methods: {
        post: {
          middlewares: [commonCtrls.isAuthenticated, commonCtrls.isValidTransactionHash, walletController.deposit],
        },
      },
    },
    {
      path: '/withdraw',
      methods: {
        post: {
          middlewares: [commonCtrls.isAuthenticated, walletController.withdraw],
        },
      },
    },
  ],
};
