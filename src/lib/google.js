const https = require('node:https');

const {
  security: {
    recaptcha: { secretKey },
  },
} = require('~/config/index');

exports.verify = (token) =>
  new Promise((done, reject) => {
    https.get(
      `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`,
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error('Error while verifying the token'));
        }

        let data = '';
        res.setEncoding('utf-8');
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('close', () => done(JSON.parse(data)));
        return true;
      },
    );
  });
