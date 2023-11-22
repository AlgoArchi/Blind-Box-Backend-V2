const log = require('debug')('app:index');
const pkg = require('../package.json');

const { port: PORT, host: HOST, publicUrl, apiPrefix, mysql } = require('./config/index');

const { start } = require('./lib/app');
const { autoTransactionCheck } = require('./lib/autoUpdate');
const { sequelize } = require('./models/index');
const { ownerNonce } = require('./utils/ownerNonce');

(async () => {
  await sequelize.sync({ alter: true });
  console.log("All models were synchronized successfully.");
  await ownerNonce();

  console.log("XBUFF Betting Auto Processing...")
  const contractListener = require('./schedule/contract.listener');
  const xbuffScheduler = require('./schedule/xbuff.scheduler');
  const realTimeBTCPrice = require('./lib/realTimeBTC.socket');

  const app = await start();

  app.listen(PORT, HOST, () => {
    log('Env               : %s', process.env.NODE_ENV);
    log('App               : %s', pkg.name);
    log('Version           : %s', pkg.version);
    log(
      'MYSQLs          : mysql://%s:%s@%s:%d/%s',
      mysql.username,
      mysql.password,
      mysql.options.host,
      mysql.options.port,
      mysql.db,
    );
    log('Server started at : %s%s', publicUrl, apiPrefix);
  });
  await autoTransactionCheck();

})();
