const { VERIFY_CODE_TYPES } = require('~/utils/constants');

/**
 * Get the model
 * @param {import("sequelize").Sequelize} sequelize sequelize instance
 * @param {{ DataTypes: import("sequelize").DataTypes }} options sequelize options
 * @returns {import("sequelize").Model}
 */
const getVerifyCode = (sequelize, { DataTypes }) => {
  const VerifyCode = sequelize.define('verifycodes', {
    email: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    code: { type: DataTypes.INTEGER },
    nb_tries: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastTryAt: { type: DataTypes.DATE },
    nb_resends: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastResendAt: { type: DataTypes.DATE },
    // type: {
    //   type: DataTypes.ENUM([VERIFY_CODE_TYPES.VALIDATE_EMAIL, VERIFY_CODE_TYPES.FORGOT_PASSWORD]),
    //   defaultValue: VERIFY_CODE_TYPES.VALIDATE_EMAIL,
    //   primaryKey: true,
    // },
  });

  return VerifyCode;
};

module.exports = getVerifyCode;
