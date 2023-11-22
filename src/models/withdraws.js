const User = require("./users");

const getWithdrawModel = (sequelize, { DataTypes }) => {
  const Withdraw = sequelize.define(
    'withdraws',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      wallet_address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      asset: {
        type: DataTypes.ENUM('USDT', 'USDC'),
        defaultValue: 'USDT',
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2
      },
    }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  Withdraw.associate = () => {
    Withdraw.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return Withdraw;
};

module.exports = getWithdrawModel;
