const User = require("./users");

const getNFTLoanHistoryModel = (sequelize, { DataTypes }) => {
  const NFTLoanHistory = sequelize.define(
    'nftLoanHistories',
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
      tokenId: {
        type: DataTypes.INTEGER
      },
      loanAmount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
      },
      status: {
        type: DataTypes.ENUM('LOANED', 'REFUNDED'),
        defaultValue: 'LOANED',
      },
    }, {
    timestamps: true,
    createdAt: true,
    updatedAt: 'updateTimestamp'
  });

  NFTLoanHistory.associate = () => {
    NFTLoanHistory.belongsTo(User, {
      foreignKey: 'user_id',
    });
  };

  return NFTLoanHistory;
};

module.exports = getNFTLoanHistoryModel;
