const { Sequelize } = require('sequelize');

const { mysql } = require('~/config/index');

const getUserModel = require('./users');
const getLootBoxFirst = require('./lootboxfirst.model');
const getLootBoxSecond = require('./lootboxsecond.model');
const getWalletModel = require('./wallets');
const getDepositModel = require('./deposits');
const getTransactionModel = require('./transactions');

const sequelize = new Sequelize(mysql.db, mysql.username, mysql.password, mysql.options);

const models = {
  User: getUserModel(sequelize, Sequelize),
  LootBoxFirst: getLootBoxFirst(sequelize, Sequelize),
  LootBoxSecond: getLootBoxSecond(sequelize, Sequelize),
  Wallet: getWalletModel(sequelize, Sequelize),
  Deposit: getDepositModel(sequelize, Sequelize),
  Transaction: getTransactionModel(sequelize, Sequelize),
};

const globalSync = async () => {
  console.log("calling sync ")
  await sequelize.sync({ alter: true });
  console.log("All models were synchronized successfully.");
}

globalSync();
module.exports = { sequelize, ...models };
