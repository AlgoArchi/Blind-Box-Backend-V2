const authCtrls = require('~/controllers/auth.controllers');
const commonCtrls = require('~/controllers/common.controllers');
const { validate } = require('~/lib/ajv');

const schemas = require('~/schemas/index');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/',
  routes: [
    {
      path: '/me',
      methods: {
        /**
         * @openapi
         *  /me:
         *    get:
         *      description: Get the current user profile
         *      tags:
         *      - Auth
         *      security:
         *      - jwt: []
         *      responses:
         *        200:
         *          $ref: '#/components/responses/user'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        get: {
          middlewares: [authCtrls.me],
        },
        /**
         * @openapi
         *  /me:
         *    post:
         *      description: Update the current user profile
         *      tags:
         *      - Auth
         *      security:
         *      - jwt: []
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/EditProfileSchema'
         *            example:
         *              name: John Doe
         *              eth_key: <eth_key>
         *              wallet_provider: metamask
         *              eth_network: ''
         *      responses:
         *        200:
         *          $ref: '#/components/responses/user'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        post: {
          middlewares: [
            commonCtrls.isAuthenticated,
            validate(schemas.editProfile),
            authCtrls.editProfile,
          ],
        },
      },
    },
  ],
};
