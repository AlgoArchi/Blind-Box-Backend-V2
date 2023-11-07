const jwt = require('jsonwebtoken');
const { pick } = require('lodash');
const { promisify } = require('node:util');
const { jwt: jwtConfig } = require('~/config/index');

/**
 * Create signed token
 * @param {string} id the user identifier
 * @param {object} payload the payload
 * @returns {string} the token
 */
exports.signToken = async (id, payload = {}, desc = '') => {
  return jwt.sign(
    {
      iss: jwtConfig.iss,
      aud: jwtConfig.aud,
      exp: Math.floor(Date.now() / 1000) + jwtConfig.exp,
      ...payload,
      sub: id,
    },
    jwtConfig.privateKey,
    {
      algorithm: 'ES512',
    },
  );
};

/**
 * Get the sanitized object
 * @param {Object} object The object
 * @param {'user'} type Object type
 * @returns sanitized object
 */
exports.getPublic = (object, type = 'user') => {
  switch (type) {
    case 'user':
      return pick(object, [
        'id',
        'name',
        'email',
        'roles',
        'active',
        'eth_key',
        'eth_network',
        'wallet_status',
        'wallet_provider',
      ]);
    default:
      return object;
  }
};

exports.sendError = (req, res, statusCode, message, err) => {
  res.status(statusCode || 500).json({
    success: false,
    message: message || err.message,
  });
};

exports.verifyToken = async (req) => {
  let token;

  if (req.body.token) {
    ({ token } = req.body);
  }

  if (!token) {
    return false;
  }
  try {
    const decoded = await promisify(jwt.verify)(token, jwtConfig.publicKey, {
      algorithms: ['ES512'],
      audience: jwtConfig.aud[0],
      issuer: jwtConfig.iss,
    });

    if (decoded.id === process.env.JWT_AUTHORIZATION) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};
