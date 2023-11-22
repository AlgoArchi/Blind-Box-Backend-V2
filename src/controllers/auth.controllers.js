const log = require('debug')('app:controllers:auth');

const { sendError, signToken, getPublic } = require('~/utils/utils');
const env = require('~/lib/nunjucks');
const { User } = require('~/models/index');
const { security } = require('~/config/index');
const { VERIFY_CODE_TYPES } = require('~/utils/constants');
const { verify } = require('~/lib/google');
const { Op } = require('sequelize');
const isEmpty = require('~/helper/isEmpty');
const { Web3 } = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.MAIN_PROVIDER));

/**
 * Update current user profile
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */

exports.connnectWallet = async (req, res) => {
  const { wallet_address, signed_message, signature } = req.body;
  console.log("wallet_address", wallet_address, "signed_message", signed_message, "signature", signature);
  if (isEmpty(wallet_address) || isEmpty(signed_message) || isEmpty(signature)) {
    return res.status(400).json({ success: false, message: "Invalid Request!" });
  }
  console.log("2");

  const actualAddress = await web3.eth.accounts.recover(signed_message, signature);
  console.log("Actual Address", actualAddress)
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
      token = await signToken({ id: existUser.id, wallet_address: existUser.wallet_address.toLowerCase() });
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
