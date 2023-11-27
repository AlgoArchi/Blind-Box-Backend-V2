const { Sequelize } = require('sequelize');

const { mysql } = require('~/config/index');

const getUserModel = require('./users');
const getLootBoxFirst = require('./lootboxfirst.model');
const getLootBoxSecond = require('./lootboxsecond.model');
const getWalletModel = require('./wallets');
const getDepositModel = require('./deposits');
const getTransactionModel = require('./transactions');
const getWithdrawModel = require('./withdraws');
const getRoundModel = require('./rounds');
const getBettingModel = require('./bettings');
const getAdminModel = require('./admins');
const getNFTLoansModel = require('./nftLoans');
const getNFTLoanHistoryModel = require('./nftLoanHistories');

const sequelize = new Sequelize(mysql.db, mysql.username, mysql.password, mysql.options);

const models = {
  User: getUserModel(sequelize, Sequelize),
  LootBoxFirst: getLootBoxFirst(sequelize, Sequelize),
  LootBoxSecond: getLootBoxSecond(sequelize, Sequelize),
  Wallet: getWalletModel(sequelize, Sequelize),
  Deposit: getDepositModel(sequelize, Sequelize),
  Transaction: getTransactionModel(sequelize, Sequelize),
  Withdraw: getWithdrawModel(sequelize, Sequelize),
  Round: getRoundModel(sequelize, Sequelize),
  Betting: getBettingModel(sequelize, Sequelize),
  Admin: getAdminModel(sequelize, Sequelize),
  NFTLoan: getNFTLoansModel(sequelize, Sequelize),
  NFTLoanHistory: getNFTLoanHistoryModel(sequelize, Sequelize)
};

module.exports = { sequelize, ...models };
