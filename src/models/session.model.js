const User = require('./users');

/**
 * Get the model
 * @param {import("sequelize").Sequelize} sequelize sequelize instance
 * @param {{ DataTypes: import("sequelize").DataTypes }} options sequelize options
 * @returns {import("sequelize").Model}
 */
const getSessionModel = (sequelize, { DataTypes }) => {
  const Session = sequelize.define('sessions', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: { type: DataTypes.INTEGER },
    desc: { type: DataTypes.STRING },
  });

  Session.associate = () => {
    Session.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return Session;
};

module.exports = getSessionModel;
