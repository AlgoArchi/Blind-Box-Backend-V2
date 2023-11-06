const { hasOneOfRoles } = require('~/controllers/common.controllers');
const userCtrls = require('~/controllers/user.controllers');
const { validate } = require('~/lib/ajv');
const { ROLES } = require('~/utils/constants');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/users',
  before: [hasOneOfRoles(ROLES.ADMIN)],
  routes: [
    {
      path: '/byEmail',
      methods: {
        /**
         * @openapi
         *  /users/byEmail:
         *    get:
         *      description: Get user by its email address
         *      tags:
         *      - User
         *      security:
         *      - jwt: []
         *      parameters:
         *      - in: query
         *        name: email
         *        schema:
         *          type: string
         *        required: true
         *        description: Email address
         *        example: test@example.com
         *      responses:
         *        200:
         *          $ref: '#/components/responses/user'
         *        401:
         *          $ref: '#/components/responses/401'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        get: {
          middlewares: [
            validate(
              {
                type: 'object',
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    errorMessage: {
                      format: 'Invalid email address',
                    },
                  },
                },
                required: ['email'],
              },
              'query',
            ),
            userCtrls.getUserByEmail,
          ],
        },
      },
    },
    {
      path: '/check',
      methods: {
        /**
         * @openapi
         *  /users/check:
         *    post:
         *      description: Check if the current user is valid
         *      tags:
         *      - User
         *      security:
         *      - jwt: []
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              type: object
         *            example:
         *              email: test@example.com
         *              password: '123456'
         *      responses:
         *        200:
         *          $ref: '#/components/responses/success'
         *        401:
         *          $ref: '#/components/responses/401'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        post: {
          middlewares: [
            validate({
              type: 'object',
              properties: {
                email: {
                  type: 'string',
                },
                password: {
                  type: 'string',
                },
              },
              required: ['email', 'password'],
            }),
            userCtrls.check,
          ],
        },
      },
    },
  ],
};
