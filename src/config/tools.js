const log = require('debug')('app:config');
const dotenv = require('dotenv');

dotenv.config({
  path: '.env/.common.env',
});

dotenv.config({
  path: `.env/.${process.env.NODE_ENV || 'local'}.env`,
});

const variables = require('./variables');

exports.get = (() => {
  const cache = {};

  return (envVarName) => {
    if (typeof cache[envVarName] !== 'undefined') return cache[envVarName];

    let result = process.env[envVarName];
    const variable = variables[envVarName];

    if (!variable) return result;

    const { defaultValue, type = 'string' } = variable;

    if (typeof result === 'undefined') result = defaultValue;

    switch (type) {
      case 'number':
        return +result;
      case 'boolean':
        return result === 'true' || result === true;
      default:
        return result;
    }
  };
})();

exports.print = () => {
  const max_length = {
    group: 0,
    label: 0,
  };
  /**
   * Extract variables should be logged and group them
   */
  const groups = Object.entries(variables).reduce(
    (prev, [key, { name = key, log: isLog, group = 'global' }]) => {
      if (isLog === false) return prev;
      let g = prev.find(({ name: n }) => n === group);
      if (!g) {
        g = { name: group, variables: [] };
        prev.push(g);
      }
      g.variables.push({
        name,
        value: exports.get(key),
      });

      if (group.length > max_length.group) max_length.group = group.length;
      if (name.length > max_length.label) max_length.label = name.length;
      return prev;
    },
    [],
  );

  groups.sort(({ name: a }, { name: b }) => a.length - b.length);

  groups.forEach(({ name: group, variables: vars }) => {
    vars
      .sort(({ name: a }, { name: b }) => a.length - b.length)
      .forEach(({ name, value }) => {
        const label = `${`[${group}]`.padEnd(max_length.group + 2)} ${name.padEnd(
          max_length.label + 1,
        )}`;
        log(`${label}: ${value === '' ? '<empty>' : value}`);
      });
  });
};
