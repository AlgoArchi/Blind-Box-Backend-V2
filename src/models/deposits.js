const User = require("./users");

const getDepositModel = (sequelize, { DataTypes }) => {
  const Deposit = sequelize.define(
    'deposits',
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
      transaction_hash: {
        type: DataTypes.STRING,
        allowNull: false,
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

  Deposit.associate = () => {
    Deposit.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return Deposit;
};

module.exports = getDepositModel;
