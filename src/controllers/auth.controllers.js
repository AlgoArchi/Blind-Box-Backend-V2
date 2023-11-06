const crypto = require('node:crypto');
const axios = require('axios').default;
const log = require('debug')('app:controllers:auth');

const { sendError, signToken, getPublic } = require('~/utils/utils');
const env = require('~/lib/nunjucks');
const { User, VerifyCode, Session } = require('~/models/index');
const { security, publicUrl } = require('~/config/index');
// const { updatePassword } = require('~/utils/paramlabs');
const { VERIFY_CODE_TYPES } = require('~/utils/constants');
const { verify } = require('~/lib/google');
const { Op } = require('sequelize');

/**
 * Update current user profile
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.editProfile = async function updateProfile(req, res) {
  const { user, body } = req;

  try {
    await User.update(body, {
      where: { id: user.id },
    });
    await user.reload();
    return res.json({ success: true, user: getPublic(user) });
  } catch (e) {
    log('Error while updating user profile', e);
    return sendError(req, res, 400, 'Failed to update the user profile');
  }
};

exports.recaptcha = async (req, res, next) => {
  const { token } = req.body;

  if (!security.recaptcha.enabled) {
    return next();
  }

  if (!token) {
    return sendError(req, res, 400, 'Recaptcha token is mandatory');
  }

  try {
    const result = await verify(token);
    if (!result || !result.success) {
      return sendError(req, res, 500, 'Invalid recaptcha token');
    }

    if (result.score < security.recaptcha.score) {
      log('Robot detected. Action: %s', result.action);
      return sendError(req, res, 400, 'Robot detected');
    }
  } catch (e) {
    return sendError(req, res, 500, e.message);
  }

  return next();
};

exports.me = async (req, res) => {
  const { user } = req;
  return res.json({ success: true, user: user ? getPublic(user) : null });
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existUser = await User.findOne({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (existUser) {
      return sendError(req, res, 400, 'User already exists.');
    }

    const code = crypto.randomInt(security.code.min, security.code.max);
    const template = env.render('verify-email.view.njk', {
      title: 'Email verification',
      code,
      link: `${publicUrl}/api/v1/auth/verifyCode?email=${encodeURIComponent(
        email.toLowerCase(),
      )}&code=${code}`,
    });
    await User.create({ name, email: email.toLowerCase(), password });
    await VerifyCode.create({
      email: email.toLowerCase(),
      code,
      type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
    });

    return res.json({ success: true });
  } catch (err) {
    log('error', 'err:', err);
    return sendError(req, res, 400, 'Invalid user data:');
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user_exist = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user_exist) {
      return res.status(400).json({ success: false, message: 'User does not exist' });
    }

    const non_activated_user = await User.findOne({
      where: { email: email.toLowerCase(), active: false },
    });

    if (non_activated_user) {
      return res.status(400).json({ success: false, message: 'Please verify your email' });
    }

    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase(), active: true },
    });

    if (!(await user.correctPassword(password, user.password)))
      return res.status(400).json({ success: false, message: 'Email/Password does not match' });

    const token = await signToken(user.id);
    return res.status(200).json({ success: true, user: getPublic(user, 'user'), token });
  } catch (err) {
    log('Error while login the user', err);
    return sendError(req, res, 400, 'Invalid user data');
  }
};

/**
 * @param {'body' | 'query'} placement
 */
exports.activateAccount = function activateAccount(placement = 'body') {
  return async (req, res) => {
    const { email } = req[placement];
    try {
      await User.update(
        {
          active: true,
        },
        {
          where: { email: email.toLowerCase() },
        },
      );

      return res.status(200).format({
        json() {
          return res.send({ success: true });
        },
        html() {
          const template = env.render('message.view.njk', {
            title: 'Email verified',
            className: 'success',
            subtitle: 'Success!',
            message: 'Your email address has been verified.',
          });
          return res.send(template);
        },
      });
    } catch (err) {
      log('error', 'err:', err);
      return res.status(200).format({
        json() {
          return sendError(req, res, 400, 'Invalid verification code');
        },
        html() {
          const template = env.render('message.view.njk', {
            title: 'Email verification failed',
            className: 'error',
            subtitle: 'Error!',
            message: 'Invalid verification code',
          });
          return res.send(template);
        },
      });
    }
  };
};

/**
 * Resend a verification code
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.resendVerificationCode = async (req, res) => {
  const { email, type } = req.body;

  const options = (() => {
    switch (type) {
      case 'forgot-password':
        return {
          template: 'reset-password.view.njk',
          title: 'Reset Password Code',
          type: VERIFY_CODE_TYPES.FORGOT_PASSWORD,
        };
      default:
        return {
          template: 'verify-email.view.njk',
          title: 'Activate your account',
          type: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
        };
    }
  })();

  try {
    const user = await User.findOne({
      where: { email: email.toLowerCase(), active: type === 'forgot-password' },
    });

    if (!user) {
      log('[%s:resendCode] user was not found', type, email.toLowerCase());
      return res.json({
        success: true,
        message: 'Verification code sent if your account was found',
      });
    }

    let verifyCode = await VerifyCode.findOne({
      where: {
        email: email.toLowerCase(),
        type: options.type,
      },
    });

    const code = crypto.randomInt(security.code.min, security.code.max);

    if (verifyCode) {
      if (Date.now() - verifyCode.createdAt.getTime() > security.code.ttl) {
        await verifyCode.destroy();
        verifyCode = await VerifyCode.create({
          email: email.toLowerCase(),
          type: options.type,
          code,
        });
      }

      if (verifyCode.nb_resends >= security.code.maxSends)
        return res.status(400).json({ success: false, message: 'Max resends reached' });

      if (
        verifyCode.lastResendAt &&
        Date.now() - verifyCode.lastResendAt.getTime() <= security.code.delay
      )
        return res
          .status(400)
          .json({ success: false, message: 'Too quick, please wait and try again' });

      verifyCode.lastResendAt = new Date();
      verifyCode.nb_resends += 1;

      await verifyCode.save();
    } else {
      verifyCode = await VerifyCode.create({
        email: email.toLowerCase(),
        type: options.type,
        code,
      });
    }

    const template = env.render(options.template, {
      title: options.title,
      code: verifyCode.code,
    });

    // await sg.sendMail(email.toLowerCase(), options.title, template);

    return res.json({ success: true });
  } catch (err) {
    log('error', 'err:', err);
    return sendError(req, res, 400, 'Invalid user email');
  }
};

exports.checkCode = function checkCode(
  type = VERIFY_CODE_TYPES.VALIDATE_EMAIL,
  isCheckUserActive = true,
  /**
   * @type {'body' | 'query'}
   */
  placement = 'body',
) {
  return async (req, res, next) => {
    const { email, code } = req[placement];
    const message = 'Invalid code or email address';

    try {
      const filter = isCheckUserActive
        ? { email: email.toLowerCase(), active: true }
        : { email: email.toLowerCase() };
      const user = await User.findOne({ where: filter });

      if (!user) {
        log('trying to validate invalid user account', email);
        return res.status(400).format({
          json() {
            return sendError(req, res, 400, message);
          },
          html() {
            const template = env.render('message.view.njk', {
              title: 'Email verification failed',
              className: 'error',
              subtitle: 'Error!',
              message,
            });
            return res.send(template);
          },
        });
      }

      const verifyCode = await VerifyCode.findOne({
        where: {
          email: email.toLowerCase(),
          type,
        },
      });

      if (!verifyCode) {
        log('trying to validate a user account with invalid code', email, code);
        return res.status(400).format({
          json() {
            return sendError(req, res, 400, message);
          },
          html() {
            const template = env.render('message.view.njk', {
              title: 'Email verification failed',
              className: 'error',
              subtitle: 'Error!',
              message,
            });
            return res.send(template);
          },
        });
      }

      if (Date.now() - verifyCode.createdAt.getTime() > security.code.ttl) {
        await verifyCode.destroy();
        return res.status(400).format({
          json() {
            return sendError(req, res, 400, 'Code expired');
          },
          html() {
            const template = env.render('message.view.njk', {
              title: 'Email verification failed',
              className: 'error',
              subtitle: 'Error!',
              message: 'Code expired',
            });
            return res.send(template);
          },
        });
      }

      if (verifyCode.nb_tries >= security.code.maxTries)
        return res.status(400).format({
          json() {
            return sendError(req, res, 400, 'Max tries reached');
          },
          html() {
            const template = env.render('message.view.njk', {
              title: 'Email verification failed',
              className: 'error',
              subtitle: 'Error!',
              message: 'Max tries reached',
            });
            return res.send(template);
          },
        });

      if (
        verifyCode.lastTryAt &&
        Date.now() - verifyCode.lastTryAt.getTime() <= security.code.tryDelay
      )
        return res.status(400).format({
          json() {
            return sendError(req, res, 400, 'Too quick, please wait and try again');
          },
          html() {
            const template = env.render('message.view.njk', {
              title: 'Email verification failed',
              className: 'error',
              subtitle: 'Error!',
              message: 'Too quick, please wait and try again',
            });
            return res.send(template);
          },
        });

      if (verifyCode.code !== +code) {
        verifyCode.lastTryAt = new Date();
        verifyCode.nb_tries += 1;

        await verifyCode.save();
        return res.status(400).format({
          json() {
            return sendError(req, res, 400, message);
          },
          html() {
            const template = env.render('message.view.njk', {
              title: 'Email verification failed',
              className: 'error',
              subtitle: 'Error!',
              message,
            });
            return res.send(template);
          },
        });
      }

      await verifyCode.destroy();
    } catch (err) {
      log('error', 'err:', err);
      return sendError(req, res, 400, 'Invalid user data: ');
    }

    return next();
  };
};

exports.updatePassword = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });
    user.password = password;
    await user.save();
    const template = env.render('reset-password-success.view.njk', {
      title: 'Password Reset Successfully',
    });

    // await sg.sendMail(email.toLowerCase(), 'Password Reset Successfully', template);

    return res.status(200).json({ success: true });
  } catch (err) {
    log('error', 'err:', err);
    return sendError(req, res, 400, 'Invalid user data: ');
  }
};

exports.logout = async (req, res) => {
  const { session } = req;

  if (!session) {
    return res.status(200).json({ success: true });
  }

  try {
    await session.destroy();
  } catch (e) {
    return sendError(req, res, 400, 'Invalid EOS token:');
  }

  return res.status(200).json({ success: true });
};

exports.changePassword = async (req, res) => {
  const { user, session } = req;

  const { old_password, new_password } = req.body;

  try {
    if (!(await user.correctPassword(old_password, user.password))) {
      return sendError(req, res, 401, 'Please make sure your old password is correct');
    }

    // Remove all sessions except the current one
    await Session.destroy({
      where: {
        id: {
          [Op.ne]: session.id,
        },
        user_id: user.id,
      },
    });

    // Update the current user password
    user.password = new_password;
    await user.save();

    const template = env.render('change-password-success.view.njk', {
      title: 'Password changed',
    });

    // await sg.sendMail(user.email, 'Password changed Successfully', template);

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    log('err:', err);
    return sendError(req, res, 400, 'Invalid user data: ');
  }
};

exports.createKiraPlayer = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      return sendError(req, res, 400, 'No user found for given email.');
    }
    const resp = await axios.post(`${process.env.KIRA_BASE_URL}/api/v1/auth/importPlayer`, {
      email,
      name: user.name,
      password: user.password,
    });
    if (!resp.data.success) return sendError(req, res, 400, resp.data.message);
    return res.status(200).json(resp.data);
  } catch (err) {
    log('err:', err);
    return sendError(req, res, 400, 'Invalid user data: ');
  }
};
