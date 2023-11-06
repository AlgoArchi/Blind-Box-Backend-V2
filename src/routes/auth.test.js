const request = require('supertest');
const { it, before, describe, beforeEach, afterEach } = require('mocha');
const { expect } = require('chai');
const sinon = require('sinon');

const { apiPrefix, security } = require('~/config/index');
const { User, VerifyCode, Session } = require('~/models/index');
const { start } = require('~/lib/app');
const { VERIFY_CODE_TYPES } = require('~/utils/constants');
const { signToken } = require('~/utils/utils');
const sg = require('~/lib/sendgrid');

let app;
let agent;
const sandbox = sinon.createSandbox();

describe('[Auth]', () => {
  before(async () => {
    app = await start();
    agent = request.agent(app);
  });

  beforeEach(() => {
    sandbox.stub(sg, 'sendMail').returns(Promise.resolve(true));
  });

  afterEach(async () => {
    sandbox.restore();
    Promise.all(
      [User, VerifyCode, Session].map((Model) =>
        Model.destroy({
          where: {},
          truncate: true,
        }),
      ),
    );
  });

  describe('Login API', () => {
    it('email and password are required', async () => {
      const res = await agent.post(`${apiPrefix}/auth/login`).send({}).expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', "must have required property 'email'");
      expect(errors).to.have.nested.property(
        '[1].message',
        "must have required property 'password'",
      );
    });

    it('reject invalid email address', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'invalid email address',
          password: '123456',
        })
        .expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', 'Invalid email address');
    });

    it('should not accept additional properties', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: '123456',
          foo: 'bar',
        })
        .expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', 'must NOT have additional properties');
    });

    it('should succeed if the user does exist', async () => {
      await User.create({
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: '123456',
        })
        .expect(200);
      const { success, token, user } = res.body;
      expect(success).to.eq(true);
      expect(user).to.be.an('object');
      expect(token).to.be.a('string');
    });

    it('email is case insensitive', async () => {
      await User.create({
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'TeSt@ExAmPle.COM',
          password: '123456',
        })
        .expect(200);
      const { success, token, user } = res.body;
      expect(success).to.eq(true);
      expect(user).to.be.an('object');
      expect(token).to.be.a('string');
    });

    it('should not succeed if the user does exist but not active', async () => {
      await User.create({
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: '123456',
        })
        .expect(400);
      expect(res.body).to.eql({
        success: false,
        message: 'Please verify your email',
      });
    });

    it('should not succeed if the user does not exist', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: '123456',
        })
        .expect(400);
      expect(res.body).to.eql({
        success: false,
        message: 'User does not exist',
      });
    });

    it('should not succeed if the password is not correct', async () => {
      await User.create({
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const res = await agent
        .post(`${apiPrefix}/auth/login`)
        .send({
          email: 'test@example.com',
          password: 'wrong_password',
        })
        .expect(400);
      expect(res.body).to.eql({
        success: false,
        message: 'Email/Password does not match',
      });
    });
  });

  describe('Register API', () => {
    it('email, name and password are required', async () => {
      const res = await agent.post(`${apiPrefix}/auth/register`).send({}).expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', "must have required property 'name'");
      expect(errors).to.have.nested.property('[1].message', "must have required property 'email'");
      expect(errors).to.have.nested.property(
        '[2].message',
        "must have required property 'password'",
      );
    });

    it('reject invalid email address', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/register`)
        .send({
          name: 'John Doe',
          email: 'invalid email address',
          password: '123456',
        })
        .expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', 'Invalid email address');
    });

    it('should reject if the name is invalid', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/register`)
        .send({
          name: 'John*Doe',
          email: 'test@example.com',
          password: '123456',
        })
        .expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', 'Please enter a valid name');
    });

    it('should not accept additional properties', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/register`)
        .send({
          name: 'John Doe',
          email: 'test@example.com',
          password: '123456',
          foo: 'bar',
        })
        .expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', 'must NOT have additional properties');
    });

    it('should reject if the user already exist', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const res = await agent
        .post(`${apiPrefix}/auth/register`)
        .send({
          name: 'John Doe',
          email: 'test@example.com',
          password: '123456',
        })
        .expect(400);
      const { message } = res.body;
      expect(message).to.eql('User already exists.');
    });

    it('should succeed if the user does not exist', async () => {
      const res = await agent
        .post(`${apiPrefix}/auth/register`)
        .send({
          name: 'John Doe',
          email: 'test@example.com',
          password: '123456',
        })
        .expect(200);
      const { success } = res.body;
      expect(success).to.eql(true);
      const code = await VerifyCode.findOne({
        where: {
          email: 'test@example.com',
          type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        },
      });

      expect(code).is.not.eql(null);
      sandbox.assert.calledWith(sg.sendMail, 'test@example.com', 'Activate your account');
    });
  });

  describe('Logout API', () => {
    it('should logout unauthenticated user', async () => {
      await agent.post(`${apiPrefix}/auth/logout`).send().expect(200);
    });
    it('should logout a authenticated user', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const token = await signToken(user.id);
      await agent
        .post(`${apiPrefix}/auth/logout`)
        .set('authorization', `Bearer ${token}`)
        .send()
        .expect(200);
    });
    it('should reject if the token is invalid', async () => {
      await agent
        .post(`${apiPrefix}/auth/logout`)
        .set('authorization', 'Bearer invalid_token')
        .send()
        .expect(401);
    });
  });

  describe('Confirm Verify Code', () => {
    it('should reject if the user does not exist', async () => {
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
    });

    it('should reject if the user is already active', async () => {
      await User.create({
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
    });

    it('should reject if the user has not created a verification code', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
    });

    it('should reject if the code has expired', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        code: 123456,
        createdAt: new Date(Date.now() - security.code.ttl - 1),
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Code expired');
    });

    it('should reject if max tries exceeded', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        code: 123456,
        createdAt: new Date(),
        nb_tries: security.code.maxTries,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Max tries reached');
    });

    it('should reject if tried too quickly', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        code: 123456,
        createdAt: new Date(),
        nb_tries: 0,
        lastTryAt: new Date(),
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Too quick, please wait and try again');
    });

    it('should reject if the code is invalid', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      const code = await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        code: 123456,
        createdAt: new Date(Date.now() - 30000),
        nb_tries: 0,
        lastTryAt: new Date(Date.now() - 30000),
      });
      const now = new Date();
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 321654,
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
      await code.reload();
      expect(code.lastTryAt > now).to.eql(true);
      expect(code.nb_tries).to.eql(1);
    });

    it('should succeed otherwise', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      const code = await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        code: 123456,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/verifyCode`)
        .send({
          email: 'test@example.com',
          code: 123456,
        })
        .expect(200);

      expect(body.success).to.eql(true);
      let err;
      try {
        await code.reload();
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('Error');
      await user.reload();
      expect(user.active).to.eql(true);
    });
  });

  describe('Resend Verify Code', () => {
    it('should return a generic message if the account does not exist', async () => {
      const { body } = await agent
        .post(`${apiPrefix}/auth/resendVerifyCode`)
        .send({
          email: 'test@example.com',
          type: 'forgot-password',
        })
        .expect(200);

      expect(body.success).to.eql(true);
      expect(body.message).to.eql('Verification code sent if your account was found');
    });

    it('the type should be "forgot-password" or "validate-email"', async () => {
      const { body } = await agent
        .post(`${apiPrefix}/auth/resendVerifyCode`)
        .send({
          email: 'test@example.com',
          type: 'random',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.errors[0].message).to.eql(
        "Invalid type. Possible values: 'forgot-password', 'validate-email'",
      );
    });

    it('should success if the code has expired', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(Date.now() - security.code.ttl - 1),
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/resendVerifyCode`)
        .send({
          email: 'test@example.com',
          type: 'forgot-password',
        })
        .expect(200);

      expect(body.success).to.eql(true);
    });

    it('should reject if max tries exceeded', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(),
        nb_resends: security.code.maxSends,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/resendVerifyCode`)
        .send({
          email: 'test@example.com',
          type: 'forgot-password',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Max resends reached');
    });

    it('should reject if tried too quickly', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(),
        nb_tries: 0,
        lastResendAt: new Date(),
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/resendVerifyCode`)
        .send({
          email: 'test@example.com',
          type: 'forgot-password',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Too quick, please wait and try again');
    });
  });

  describe('Update password', () => {
    it('should reject if the user does not exist', async () => {
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
    });

    it('should reject if the user is not active', async () => {
      await User.create({
        email: 'test@example.com',
        password: '123456',
        active: false,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
    });

    it('should reject if the user has not created a verification code', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
    });

    it('should reject if the code has expired', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(Date.now() - security.code.ttl - 1),
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Code expired');
    });

    it('should reject if max tries exceeded', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(),
        nb_tries: security.code.maxTries,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Max tries reached');
    });

    it('should reject if tried too quickly', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(),
        nb_tries: 0,
        lastTryAt: new Date(),
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Too quick, please wait and try again');
    });

    it('should reject if the code is invalid', async () => {
      await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const code = await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
        createdAt: new Date(Date.now() - 30000),
        nb_tries: 0,
        lastTryAt: new Date(Date.now() - 30000),
      });
      const now = new Date();
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 987654,
          password: '123456',
        })
        .expect(400);

      expect(body.success).to.eql(false);
      expect(body.message).to.eql('Invalid code or email address');
      await code.reload();
      expect(code.lastTryAt > now).to.eql(true);
      expect(code.nb_tries).to.eql(1);
    });

    it('should succeed otherwise', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const code = await VerifyCode.create({
        email: 'test@example.com',
        type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        code: 123456,
      });
      const { body } = await agent
        .post(`${apiPrefix}/auth/updatePassword`)
        .send({
          email: 'test@example.com',
          code: 123456,
          password: '123456',
        })
        .expect(200);

      expect(body.success).to.eql(true);
      let err;
      try {
        await code.reload();
      } catch (e) {
        err = e;
      }
      expect(err).to.be.an('Error');
      await user.reload();
      expect(user.active).to.eql(true);
    });
  });

  describe('Change password', () => {
    it('should reject if the user does not authorized', async () => {
      const { body } = await agent
        .post(`${apiPrefix}/auth/changePassword`)
        .send({
          old_password: '123456',
          new_password: '123123',
        })
        .expect(401);
      expect(body.message).to.eql('Not authenticated');
    });

    it('should not accept additional properties', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const token = await signToken(user.id);
      const res = await agent
        .post(`${apiPrefix}/auth/changePassword`)
        .set('authorization', `Bearer ${token}`)
        .send({
          old_password: '123123',
          new_password: '123123',
          foo: 'foo',
        })
        .expect(400);
      const { success, errors } = res.body;
      expect(success).to.eq(false);
      expect(errors).to.have.nested.property('[0].message', 'must NOT have additional properties');
    });

    it('should reject if the user does authorized and old is not correct', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const token = await signToken(user.id);
      const { body } = await agent
        .post(`${apiPrefix}/auth/changePassword`)
        .set('authorization', `Bearer ${token}`)
        .send({
          old_password: '123123',
          new_password: '123123',
        })
        .expect(401);
      expect(body.message).to.eql('Please make sure your old password is correct');
    });

    it('should success if the user does authorized and all information is correct', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'test@example.com',
        password: '123456',
        active: true,
      });
      const token = await signToken(user.id);
      const res = await agent
        .post(`${apiPrefix}/auth/changePassword`)
        .set('authorization', `Bearer ${token}`)
        .send({
          old_password: '123456',
          new_password: '123123',
        })
        .expect(200);
      expect(res.body).to.eql({
        success: true,
      });
    });
  });
});
