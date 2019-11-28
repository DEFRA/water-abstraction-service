const { mapKeys, isObject } = require('lodash');
const camelCase = require('camelcase');

exports.camelCaseKeys = obj => isObject(obj) && mapKeys(obj, (value, key) => camelCase(key));
