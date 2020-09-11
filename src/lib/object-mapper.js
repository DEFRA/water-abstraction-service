'use strict';

/**
 * @module an object mapper with a similar, more basic API to map-factory NPM module
 *         however the handling of nulls is different:
 *         by default nulls are mapped, with an option of ignoring them
 */

const { identity, get, set, isUndefined, isNull, isFunction, last, isObject, isArray } = require('lodash');

const getSourceKeys = value => {
  if (isArray(value)) {
    return value;
  } else if (isUndefined(value)) {
    return [];
  }
  return [value];
};

/**
 * Note: when data coming from DB, there may be nulls
 * For scalar values, these likely need mapping as nulls (e.g. DateRange endDate)
 * For related data, these likely don't need mapping
 */
const createMapper = (options = {}) => ({
  _map: [],

  _options: Object.assign({}, { mapNull: true }, options),

  map: function () {
    const _this = this;

    const sourceKeys = getSourceKeys(arguments[0]);

    return {
      to: (targetKey, ...args) => {
        const mapper = isFunction(args[0]) ? args[0] : identity;
        const options = isObject(last(args)) ? last(args) : {};

        if (sourceKeys.length > 1 && !mapper) {
          throw new Error(`error setting ${targetKey}: when >1 source key, a mapper is required`);
        }

        _this._map.push({
          sourceKeys,
          targetKey,
          mapper,
          options: Object.assign({}, this._options, options)
        });
        return _this;
      }
    };
  },

  execute: function (data) {
    return this._map.reduce((acc, row) => {
      // If the source key is omitted, supply the entire object
      const values = row.sourceKeys.length === 0
        ? [data]
        : row.sourceKeys.map(key => get(data, key));

      // Undefined values in the source are skipped
      if (values.every(isUndefined)) {
        return acc;
      }

      // Optionally skip null values in source (by default they are mapped)
      if (!row.options.mapNull && values.every(isNull)) {
        return acc;
      }

      return set(acc, row.targetKey, row.mapper(...values));
    }, {});
  }
});

exports.createMapper = createMapper;
