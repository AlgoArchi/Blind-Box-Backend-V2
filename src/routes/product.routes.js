const productController = require('~/controllers/product.controller');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/product',
  exclude: true,
  routes: [
    {
      path: '/getAllProducts',
      methods: {
        get: {
          middlewares: [productController.getAllProducts],
        },
      },
    },
    {
      path: '/addProduct',
      methods: {
        post: {
          middlewares: [productController.addProduct],
        },
      },
    },
    {
      path: '/updateProduct',
      methods: {
        post: {
          middlewares: [productController.updateProduct],
        },
      },
    },
    {
      path: '/deleteProduct',
      methods: {
        post: {
          middlewares: [productController.deleteProduct],
        },
      },
    },
  ],
};
