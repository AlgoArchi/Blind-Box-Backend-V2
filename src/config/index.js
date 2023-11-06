const { readFileSync } = require('node:fs');

const { get } = require('./tools');

const jwtCerts = [
  {
    name: 'Public Key',
    key: 'publicKey',
    envVar: 'JWT_PUBLIC_KEY',
  },
  {
    name: 'Private Key',
    key: 'privateKey',
    envVar: 'JWT_PRIVATE_KEY',
  },
].reduce((prev, curr) => {
  const path = get(curr.envVar);

  if (path.startsWith('-----BEGIN')) {
    return { ...prev, [curr.key]: path };
  }

  try {
    const content = readFileSync(path, { encoding: 'utf-8' });
    return { ...prev, [curr.key]: content };
  } catch (e) {
    console.warn('Cannot find the "%s". please check the "%s" file', curr.name, path);
  }

  return prev;
}, {});

module.exports = {
  port: get('PORT'),
  host: get('HOST'),
  apiPrefix: get('API_PREFIX'),
  apiExcludes: get('API_EXCLUDES'),
  publicUrl: get('PUBLIC_URL'),
  morgan: {
    enable: get('MORGAN_ENABLE'),
  },
  security: {
    code: {
      min: 10 ** (get('SECURITY_CODE_LENGTH') - 1),
      max: 10 ** get('SECURITY_CODE_LENGTH') - 1,
      delay: get('SECURITY_CODE_DELAY'),
      tryDelay: get('SECURITY_TRY_DELAY'),
      ttl: get('SECURITY_CODE_TTL'),
      maxTries: get('SECURITY_MAX_TRIES'),
      maxSends: get('SECURITY_MAX_SENDS'),
    },
    recaptcha: {
      enabled: get('RECAPTCHA_ENABLED'),
      secretKey: get('RECAPTCHA_SECRET_KEY'),
      score: get('RECAPTCHA_MIN_SCORE'),
    },
  },
  cors: {
    enabled: get('CORS_ENABLED'),
    /**
     * @type {import('cors').CorsOptionsDelegate}
     */
    options: (req, done) => {
      const value = get('CORS_ORIGIN');
      const origin = req.get('origin');

      if (value === '*') return done(null, { origin: '*' });

      if (!origin) return done(null, { origin: false });

      const whitelist = value.split(',');
      const found = whitelist.find((o) => origin.startsWith(o));
      return done(null, { origin: !!found });
    },
  },
  mysql: {
    db: get('MYSQL_DB'),
    username: get('MYSQL_USER'),
    password: get('MYSQL_PASSWORD'),
    /**
     * @type {import('sequelize').Options}
     */
    options: {
      host: get('MYSQL_HOST'),
      port: get('MYSQL_PORT'),
      logging: get('MYSQL_LOGGING'),
      operatorAliases: false,
      pool: {
        max: get('MYSQL_POOL_MAX'),
        min: get('MYSQL_POOL_MIN'),
        acquire: get('MYSQL_POOL_ACQUIRE'),
        idle: get('MYSQL_POOL_IDLE'),
      },
      dialect: 'mysql',
    },
  },
  aws: {
    domain: get('AWS_S3_DOMAIN'),
    region: get('AWS_S3_REGION'),
    bucket: get('AWS_S3_BUCKET_NAME'),
    accessKeyId: get('AWS_S3_ACCESS_KEY_ID'),
    secretAccessKey: get('AWS_S3_SECRET_ACCESS_KEY'),
  },
  jwt: {
    ...jwtCerts,
    aud: get('JWT_AUDIENCE').split(','),
    iss: get('JWT_ISSUER'),
    exp: get('JWT_EXPIRATION'),
  },
};
