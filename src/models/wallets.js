const User = require("./users");

const getWalletModel = (sequelize, { DataTypes }) => {
  const Wallet = sequelize.define(
    'wallets',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        unique: true,
        allowNull: false,
      },
      balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      }
    }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  Wallet.associate = () => {
    Wallet.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return Wallet;
};

module.exports = getWalletModel;
