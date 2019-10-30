const { reduce, isArray, isPlainObject, camelCase } = require('lodash');

const camelCaseObjectKeys = data => {
  return reduce(data, (acc, value, key) => {
    acc[camelCase(key)] = camelCaseKeys(value);
    return acc;
  }, {});
};

/**
 * Camel cases the keys of an object, or an array of objects.
 * @param {Array|Object} data The array of objects, or object that is to
 * have it's keys camel cased
 */
const camelCaseKeys = data => {
  if (isArray(data)) {
    return data.map(camelCaseKeys);
  }

  if (isPlainObject(data)) {
    return camelCaseObjectKeys(data);
  }
  return data;
};

module.exports = camelCaseKeys;
