const ENV = process.env.NODE_ENV || 'local';

/** @type {{[key: string]: { log?: boolean; name: string; defaultValue?: string; group?: string, type?: 'boolean' | 'string' | 'number' } }} */
module.exports = {
  /**
   * App
   */
  PORT: {
    name: 'Port',
    defaultValue: 3000,
  },
  HOST: {
    name: 'Host',
    defaultValue: '0.0.0.0',
  },
  API_EXCLUDES: {
    name: 'Enable API Excludes',
    defaultValue: true,
    type: 'boolean',
  },
  CORS_ENABLED: {
    name: 'Enabled',
    group: 'CORS',
    defaultValue: true,
    type: 'boolean',
  },
  RECAPTCHA_ENABLED: {
    name: 'Enable',
    group: 'Recaptcha',
    defaultValue: false,
    type: 'boolean',
  },
  RECAPTCHA_SECRET_KEY: {
    name: 'Secret Key',
    group: 'Recaptcha',
    defaultValue: 'RECAPTCHA_SECRET_KEY',
  },
  RECAPTCHA_MIN_SCORE: {
    name: 'Min Score',
    group: 'Recaptcha',
    defaultValue: 0.5,
    type: 'number',
  },
  SECURITY_CODE_LENGTH: {
    name: 'Code Length',
    group: 'Security',
    defaultValue: 6,
    type: 'number',
  },
  SECURITY_CODE_DELAY: {
    name: 'Verification Delay',
    group: 'Security',
    defaultValue: 30000, // 30s
    type: 'number',
  },
  SECURITY_TRY_DELAY: {
    name: 'Retry Delay',
    group: 'Security',
    defaultValue: 5000, // 5s
    type: 'number',
  },
  SECURITY_CODE_TTL: {
    name: 'Verification Delay',
    group: 'Security',
    defaultValue: 7200000, // 2h
    type: 'number',
  },
  SECURITY_MAX_TRIES: {
    name: 'Max Tries',
    group: 'Security',
    defaultValue: 5,
    type: 'number',
  },
  SECURITY_MAX_SENDS: {
    name: 'Max Resends',
    group: 'Security',
    defaultValue: 5,
    type: 'number',
  },
  CORS_ORIGIN: {
    name: 'Origin',
    log: false,
    group: 'CORS',
    defaultValue: '*',
  },
  PUBLIC_URL: {
    name: 'Public URL',
    defaultValue: `http://localhost:${process.env.PORT || 3000}`,
  },
  SWAGGER_SERVERS: {
    name: 'Swagger Servers',
    defaultValue: `http://localhost:${process.env.PORT || 3000}`,
  },
  MORGAN_ENABLE: {
    name: 'Enable Morgan logging',
    defaultValue: false,
    type: 'boolean',
  },
  API_PREFIX: {
    name: 'API Prefix',
    log: false,
    defaultValue: '/api/v1',
  },
  /**
   * Mysql DB
   */
  MYSQL_DB: {
    name: 'Database',
    group: 'Mysql',
    defaultValue: 'mysql',
  },
  MYSQL_HOST: {
    name: 'Host',
    group: 'Mysql',
    defaultValue: '127.0.0.1',
  },
  MYSQL_PORT: {
    name: 'Port',
    group: 'Mysql',
    defaultValue: 3306,
  },
  MYSQL_USER: {
    name: 'Username',
    log: false,
    group: 'Mysql',
    defaultValue: 'root',
  },
  MYSQL_PASSWORD: {
    name: 'Password',
    log: false,
    group: 'Mysql',
    defaultValue: '',
  },
  MYSQL_LOGGING: {
    name: 'Logging',
    log: false,
    group: 'Mysql',
    defaultValue: false,
    type: 'boolean',
  },
  MYSQL_POOL_MAX: {
    name: 'Pool Max',
    log: false,
    group: 'Mysql',
    type: 'number',
    defaultValue: 5,
  },
  MYSQL_POOL_MIN: {
    name: 'Pool Min',
    log: false,
    group: 'Mysql',
    type: 'number',
    defaultValue: 0,
  },
  MYSQL_POOL_ACQUIRE: {
    name: 'Pool Acquire',
    log: false,
    group: 'Mysql',
    type: 'number',
    defaultValue: 30000,
  },
  MYSQL_POOL_IDLE: {
    name: 'Pool IDLE',
    log: false,
    group: 'Mysql',
    type: 'number',
    defaultValue: 10000,
  },
  MYSQL_SSL: {
    name: 'SSL Required',
    log: false,
    group: 'Mysql',
    type: 'boolean',
    defaultValue: false,
  },
  /**
   * SendGrid
   */
  SENDGRID_API_KEY: {
    name: 'SendGrid API Key',
    log: false,
    group: 'Mailer',
  },
  SENDGRID_FROM: {
    name: 'From',
    group: 'Mailer',
    defaultValue: 'noreply@blindbox.io',
  },
  /**
   * AWS S3
   */
  AWS_S3_DOMAIN: {
    name: 'Domain',
    log: false,
    group: 'AWS',
    defaultValue: '',
  },
  AWS_S3_REGION: {
    name: 'Region',
    log: false,
    group: 'AWS',
    defaultValue: 'us-east-1',
  },
  AWS_S3_BUCKET_NAME: {
    name: 'Bucket Name',
    log: false,
    group: 'AWS',
    defaultValue: '',
  },
  AWS_S3_ACCESS_KEY_ID: {
    name: 'Access ID',
    log: false,
    group: 'AWS',
    defaultValue: '',
  },
  AWS_S3_SECRET_ACCESS_KEY: {
    name: 'Secret Key',
    log: false,
    group: 'AWS',
    defaultValue: '',
  },
  /**
   * JWT
   */
  JWT_ISSUER: {
    name: 'Issuer',
    log: false,
    group: 'JWT',
    defaultValue: '*',
  },
  JWT_AUDIENCE: {
    name: 'Audience',
    log: false,
    group: 'JWT',
    defaultValue: '',
  },
  JWT_EXPIRATION: {
    name: 'Expiration',
    log: false,
    group: 'JWT',
    defaultValue: 2592000, // 30 days
    type: 'number',
  },
  JWT_PUBLIC_KEY: {
    name: 'Private Key',
    log: false,
    group: 'JWT',
    defaultValue: 'certs/es512-public.pem',
  },
  JWT_PRIVATE_KEY: {
    name: 'Private Key',
    log: false,
    group: 'JWT',
    defaultValue: 'certs/es512-private.pem',
  },
};
