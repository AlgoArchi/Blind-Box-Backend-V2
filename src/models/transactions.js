const User = require("./users");

const getTransactionModel = (sequelize, { DataTypes }) => {
  const Transaction = sequelize.define(
    'transactions',
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
      asset: {
        type: DataTypes.STRING,
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
      },
      type: {
        type: DataTypes.STRING,
      },
      destination: {
        type: DataTypes.STRING,
      },
      transaction_hash: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
    }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  Transaction.associate = () => {
    Transaction.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return Transaction;
};

module.exports = getTransactionModel;
