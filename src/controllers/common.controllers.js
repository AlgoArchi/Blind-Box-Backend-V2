const jwt = require('jsonwebtoken');

const { sendError } = require('~/utils/utils');
const { User } = require('~/models/index');
const { jwt: jwtConfig } = require('~/config/index');

/**
 * Set the default format to json
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.setDefaultMime = async function setDefaultMime(req, res, next) {
  if (req.get('accept') === '*/*') res.type('json');
  return next();
};

/**
 * Load user
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.loadUser = async function loadUser(req, res, next) {
  const token = req.get('authorization') || '';

  if (!token) return next();

  const [type, value] = token.split(' ');

  if (type !== 'Bearer') return next();

  let decrypted;

  try {
    decrypted = jwt.verify(value, jwtConfig.publicKey, {
      algorithms: ['ES512'],
      audience: jwtConfig.aud,
      issuer: jwtConfig.iss,
    });
  } catch (e) {
    console.log("e ", e)
    return sendError(req, res, 401, 'Invalid access token');
  }

  const user = await User.findOne({
    where: {
      id: decrypted.id,
    },
  });

  if (!user) return sendError(req, res, 401, 'Invalid access token');

  req.user = user;
  return next();
};

/**
 * Checks if the current user has the needed roles
 * @param roles List of roles
 * @returns Middlware
 */
exports.hasOneOfRoles = function hasOneOfRoles(roles) {
  /**
   * Checks if the current user has the right roles
   * @param {import('express').Request} req The request
   * @param {import('express').Response} res The response
   * @param {Function} next Go to the next middleware
   */
  return async (req, res, next) => {
    const { user } = req;

    if (!user || !Array.isArray(user.roles) || !user.roles.find((role) => roles.includes(role))) {
      return sendError(req, res, 403, 'Unauthorized');
    }

    return next();
  };
};

/**
 * Check if the current user is authenticated
 * @param {import('express').Request} req The request
 * @param {import('express').Response} res The response
 * @param {Function} next Go to the next middleware
 */
exports.isAuthenticated = async function isAuthenticated(req, res, next) {
  const { user } = req;

  if (!user) {
    return sendError(req, res, 401, 'Not authenticated');
  }

  return next();
};

module.exports.isValidTransactionHash = async (req, res, next) => {
  const { transaction_hash } = req.body;
  // Check if the transaction hash is a non-empty string
  if (typeof transaction_hash !== 'string' || !transaction_hash) {
    return sendError(req, res, 400, 'Invalid Transaction Hash');
  }

  // Check if the transaction hash starts with "0x"
  if (!transaction_hash.startsWith("0x")) {
    return sendError(req, res, 400, 'Invalid Transaction Hash');
  }

  // Check if the remaining part of the transaction hash is a hexadecimal string
  const isValidHex = /^[0-9a-fA-F]+$/.test(transaction_hash.slice(2));
  if (!isValidHex) {
    return sendError(req, res, 400, 'Invalid Transaction Hash');
  }

  // Check if the length of the transaction hash is 66 characters
  if (transaction_hash.length !== 66) {
    return sendError(req, res, 400, 'Invalid Transaction Hash');
  }

  // If all checks pass, the transaction hash is considered valid
  return next();
}
