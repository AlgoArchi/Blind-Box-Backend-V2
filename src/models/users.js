const getUserModel = (sequelize, { DataTypes }) => {
  const User = sequelize.define(
    'users',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      wallet_address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  }
  );

  return User;
};

module.exports = getUserModel;
