'use strict';

/**
 * @module an object mapper with fluent interface based on map-factory NPM module
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

class Mapper {
  constructor (options) {
    this._rules = [];
    this._options = Object.assign({}, { mapNull: true }, options);
  }

  /**
   * Selects the supplied key or keys for mapping
   * @param {String|Array} [keys] - if not supplied, selects the entire data object.  Can use dot notation, e.g 'foo.bar.baz'
   */
  map (keys) {
    this._sourceKeys = getSourceKeys(keys);
    return this;
  }

  /**
   * Determines how the data should be mapped
   * @param {String} targetKey the property name in the target object, can use dot notation, e.g 'foo.bar.baz'
   * @param {Function} [mapper] the argument(s) are passed to this mapping function if supplied
   * @param {Object} [options]
   * @param {Boolean} [options.mapNull]  can control if null is mapped per property
   */
  to (targetKey, ...args) {
    const mapper = isFunction(args[0]) ? args[0] : null;
    const options = isObject(last(args)) ? last(args) : {};

    if (this._sourceKeys.length > 1 && !mapper) {
      throw new Error(`error mapping to .${targetKey}: when >1 source key, a mapper is required`);
    }

    this._rules.push({
      sourceKeys: this._sourceKeys,
      targetKey,
      mapper: mapper || identity,
      options: Object.assign({}, this._options, options)
    });
    return this;
  }

  /**
   * Convenience method to copy multiple properties
   * @param {Array<String>} sourceKeys
   */
  copy (...sourceKeys) {
    for (const key of sourceKeys) {
      this.map(key).to(key);
    }
    return this;
  }

  /**
   * Maps the supplied data
   * @param {Object} data - source data object
   * @return {Object} target data object
   */
  execute (data) {
    return this._rules.reduce((acc, row) => {
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
}

const createMapper = options => new Mapper(options);

exports.createMapper = createMapper;
