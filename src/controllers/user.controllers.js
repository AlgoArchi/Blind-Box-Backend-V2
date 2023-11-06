const log = require('debug')('app:paramlabs');

const { User } = require('~/models/index');
const { sendError, getPublic } = require('~/utils/utils');

/**
 * Get a specific user details by its email
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.getUserByEmail = async function getUserByEmail(req, res) {
  const { email } = req.query;
  let user;

  try {
    user = await User.findOne({
      where: { email, active: true },
    });
  } catch (e) {
    log('error while fetching the user %s', email, e);
  }

  if (!user) {
    return sendError(req, res, 404, 'User not found');
  }

  return res.json({ success: true, user: getPublic(user) });
};

/**
 * Check if an account does exist
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.check = async function check(req, res) {
  const { email, password } = req.body;

  try {
    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase(), active: true },
    });

    if (user && (await user.correctPassword(password, user.password)))
      return res.json({ success: true });
  } catch (e) {
    log('error while chgecking the user creds: %s', email, e);
  }

  return res.status(400).json({ success: false });
};
