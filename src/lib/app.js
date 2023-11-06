require('module-alias/register');

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const log = require('debug')('app:main');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');

const { sequelize } = require('~/models/index');
const routes = require('~/routes/index');
const {
  cors: corsConfig,
  morgan: { enable: isLogging },
} = require('~/config/index');

exports.start = async () => {
  const app = express();

  app.set('view engine', 'html');

  if (corsConfig.enabled) {
    log('cors enabled', corsConfig.options);
    app.use(cors(corsConfig.options));
  }

  if (isLogging) {
    log('configure logging');
    app.use(morgan('dev'));
  }

  log('set the public folder');
  app.use(express.static('public'));

  log('configure body parsers');
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  // Data sanitization against NOSQL query injection and xss
  app.use(mongoSanitize(), xss());

  log('configure static files');
  app.use('/images', express.static(`${__dirname}/uploads`));
  log('configure uploader');
  app.use(multer({ dest: './uploads/' }).any());

  log('configure routes');
  app.use(routes);

  log('configure fallbacks');
  app.get('/*', (req, res) =>
    res.status(404).json({ success: false, message: "API Doesn't Exist" }),
  );

  log('configure sequelize');
  await sequelize.sync();

  return app;
};
