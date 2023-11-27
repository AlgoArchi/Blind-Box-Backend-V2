const User = require("./users");

const getNFTLoansModel = (sequelize, { DataTypes }) => {
  const NFTLoans = sequelize.define(
    'nftLoans',
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

  NFTLoans.associate = () => {
    NFTLoans.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return NFTLoans;
};

module.exports = getNFTLoansModel;
