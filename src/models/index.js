const { Sequelize } = require('sequelize');

const { mysql } = require('~/config/index');

const getProductModel = require('./product');
const getUserModel = require('./users');
const getVerifyCodeModel = require('./verifyCode');
const getSessionModel = require('./session.model');
const getLootBoxFirst = require('./lootboxfirst.model');
const getLootBoxSecond = require('./lootboxsecond.model');

const sequelize = new Sequelize(mysql.db, mysql.username, mysql.password, mysql.options);

const models = {
  // Session: getSessionModel(sequelize, Sequelize),
  // Product: getProductModel(sequelize, Sequelize),
  // User: getUserModel(sequelize, Sequelize),
  // VerifyCode: getVerifyCodeModel(sequelize, Sequelize),
  LootBoxFirst: getLootBoxFirst(sequelize, Sequelize),
  LootBoxSecond: getLootBoxSecond(sequelize, Sequelize)
};

module.exports = { sequelize, ...models };
