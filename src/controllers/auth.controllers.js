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
const isEmpty = require('~/helper/isEmpty');
const { Web3 } = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://eth-mainnet.g.alchemy.com/v2/Q4zCr5RgApmOMXaW5BxiXqhPIZkv--5K"));

/**
 * Update current user profile
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */

exports.connnectWallet = async (req, res) => {
  const { wallet_address, signed_message, signature } = req.body;
  if (isEmpty(wallet_address) || isEmpty(signed_message) || isEmpty(signature)) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }

  const actualAddress = await web3.eth.accounts.recover(signed_message, signature);
  if (actualAddress != wallet_address) {
    return res.status(400).json({ success: false, message: "Invalid wallet address!" });
  }
  try {
    const existUser = await User.findOne({
      where: {
        wallet_address: wallet_address.toLowerCase(),
      },
    });
    let token = '';
    if (!isEmpty(existUser)) {
      token = await signToken(existUser);
    } else {
      const user = await User.create({ wallet_address: wallet_address.toLowerCase() });
      token = await signToken({ id: user.id, wallet_address: wallet_address.toLowerCase() });
    }

    return res.json({ success: true, token });
  } catch (err) {
    log('error', 'err:', err);
    return sendError(req, res, 400, 'Invalid user data:');
  }
};

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
