const lootboxController = require('~/controllers/lootbox.controller');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/lootbox',
  routes: [
    {
      path: '/',
      methods: {
        get: {
          middlewares: [lootboxController.getAllLootBoxes],
        },
      },
    },
    {
      path: '/:lootBoxId',
      methods: {
        get: {
          middlewares: [lootboxController.getLootBoxDetails],
        },
      },
    },
    {
      path: '/play',
      methods: {
        post: {
          middlewares: [lootboxController.playGame],
        },
      },
    },
  ],
};
