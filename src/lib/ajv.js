const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajvErrors = require('ajv-errors');
const log = require('debug')('app:ajv');

const ajv = new Ajv({
  allErrors: true,
});
addFormats(ajv, { mode: 'fast', formats: ['date', 'time', 'email'], keywords: true });
ajvErrors(ajv);

/**
 * Validates a payload with a given schema
 * @param {Object} schema The schema of the payload
 * @param {'body' | 'query' | 'params'} type
 */
exports.validate = (schema, type = 'body') =>
  async function validateSchema(req, res, next) {
    let validate;
    let obj;

    try {
      validate = ajv.compile(schema);
    } catch (e) {
      return next(e);
    }

    switch (type) {
      case 'params':
        obj = req.params;
        break;
      case 'query':
        obj = req.query;
        break;
      default:
        obj = req.body;
        break;
    }

    if (validate(obj)) {
      return next();
    }

    log('error', validate.errors);

    return res.status(400).json({
      success: false,
      errors: validate.errors.map(({ message, instancePath }) => ({
        message,
        instancePath,
      })),
    });
  };
