const authCtrls = require('~/controllers/auth.controllers');
const commonCtrls = require('~/controllers/common.controllers');
const { validate } = require('~/lib/ajv');

const schemas = require('~/schemas/index');
const { VERIFY_CODE_TYPES } = require('~/utils/constants');

/**
 * @type { Routes.default }
 */
module.exports = {
  prefix: '/auth',
  routes: [
    {
      path: '/login',
      methods: {
        /**
         * @openapi
         *  /auth/login:
         *    post:
         *      description: Signin the current user
         *      tags:
         *      - Auth
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/LoginSchema'
         *            example:
         *              email: test@example.com
         *              password: "123456"
         *      responses:
         *        200:
         *          $ref: '#/components/responses/user'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        post: {
          middlewares: [validate(schemas.login), authCtrls.recaptcha, authCtrls.login],
        },
      },
    },
    {
      path: '/logout',
      methods: {
        /**
         * @openapi
         *  /auth/logout:
         *    post:
         *      description: Logout the current user
         *      tags:
         *      - Auth
         *      security:
         *      - jwt: []
         *      responses:
         *        200:
         *          $ref: '#/components/responses/success'
         */
        post: {
          middlewares: [authCtrls.logout],
        },
      },
    },
    {
      path: '/register',
      methods: {
        /**
         * @openapi
         *  /auth/register:
         *    post:
         *      description: Register a new user
         *      tags:
         *      - Auth
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/RegisterSchema'
         *            example:
         *              email: test@example.com
         *              password: '123456'
         *              name: test
         *              token: <some_recaptcha_token>
         *      responses:
         *        200:
         *          $ref: '#/components/responses/success'
         *        400:
         *          description: 'Bad Request'
         *          content:
         *            application/json:
         *              example:
         *                success: false
         *                errors:
         *                - message: 'Invalid email address'
         *                  instancePath: '/email'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        post: {
          middlewares: [validate(schemas.register), authCtrls.recaptcha, authCtrls.register],
        },
      },
    },
    {
      path: '/verifyCode',
      methods: {
        /**
         * @openapi
         *  /auth/verifyCode:
         *    post:
         *      description: Verify code
         *      tags:
         *      - Auth
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/ConfirmVerifyCodeSchema'
         *            example:
         *              email: test@example.com
         *              code: 9429
         *      responses:
         *        200:
         *          $ref: '#/components/responses/success'
         *        404:
         *          $ref: '#/components/responses/404'
         */
        post: {
          middlewares: [
            validate(schemas.confirmVerifyCode),
            authCtrls.recaptcha,
            authCtrls.checkCode(VERIFY_CODE_TYPES.VALIDATE_EMAIL, false),
            authCtrls.activateAccount(),
          ],
        },
        get: {
          middlewares: [
            validate(schemas.confirmVerifyCode, 'query'),
            authCtrls.checkCode(VERIFY_CODE_TYPES.VALIDATE_EMAIL, false, 'query'),
            authCtrls.activateAccount('query'),
          ],
        },
      },
    },
    {
      path: '/updatePassword',
      methods: {
        /**
         * @openapi
         *  /auth/updatePassword:
         *    post:
         *      description: Update user password
         *      tags:
         *      - Auth
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/UpdatePasswordSchema'
         *            example:
         *              email: test@example.com
         *              password: "123456"
         *              code: 5678
         *      responses:
         *        200:
         *          $ref: '#/components/responses/success'
         *        400:
         *          description: Email not confirmed
         *          content:
         *            application/json:
         *              schema:
         *                type: object
         *              example:
         *                success: false
         *                message: Please confirm your email and verification Code
         *        404:
         *          $ref: '#/components/responses/404'
         */
        post: {
          middlewares: [
            validate(schemas.updatePassword),
            authCtrls.recaptcha,
            authCtrls.checkCode(VERIFY_CODE_TYPES.FORGOT_PASSWORD, true),
            authCtrls.updatePassword,
          ],
        },
      },
    },
    {
      path: '/resendVerifyCode',
      methods: {
        /**
         * @openapi
         *  /auth/resendVerifyCode:
         *    post:
         *      description: Resend verify code
         *      tags:
         *      - Auth
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/ResendCodeSchema'
         *            example:
         *              email: test@example.com
         *              type: validate-email
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
            validate(schemas.resendCode),
            authCtrls.recaptcha,
            authCtrls.resendVerificationCode,
          ],
        },
      },
    },
    {
      path: '/changePassword',
      methods: {
        /**
         * @openapi
         *  /auth/changePassword:
         *    post:
         *      description: Change the current user password
         *      tags:
         *      - Auth
         *      security:
         *      - jwt: []
         *      requestBody:
         *        content:
         *          application/json:
         *            schema:
         *              $ref: '#/components/schemas/ChangePasswordSchema'
         *            example:
         *              old_password: '123456'
         *              new_password: '987654'
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
            commonCtrls.isAuthenticated,
            validate(schemas.changePassword),
            authCtrls.changePassword,
          ],
        },
      },
    },
  ],
};
