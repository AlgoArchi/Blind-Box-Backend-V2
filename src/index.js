const log = require('debug')('app:index');
const pkg = require('../package.json');

const { port: PORT, host: HOST, publicUrl, apiPrefix, mysql } = require('./config/index');
const { start } = require('./lib/app');

(async () => {
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
})();
