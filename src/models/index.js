const { Sequelize } = require('sequelize');

const { mysql } = require('~/config/index');

const getUserModel = require('./users');
const getLootBoxFirst = require('./lootboxfirst.model');
const getLootBoxSecond = require('./lootboxsecond.model');
const getWalletModel = require('./wallets');

const sequelize = new Sequelize(mysql.db, mysql.username, mysql.password, mysql.options);

const models = {
  User: getUserModel(sequelize, Sequelize),
  LootBoxFirst: getLootBoxFirst(sequelize, Sequelize),
  LootBoxSecond: getLootBoxSecond(sequelize, Sequelize),
  Wallet: getWalletModel(sequelize, Sequelize),
};

module.exports = { sequelize, ...models };
