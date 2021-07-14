'use strict';

/**
 * Bookshelf yaml fixture loader
 * Inspired by https://github.com/tomi77/node-bookshelf-fixture-loader
 */

const YAML = require('yamljs');
const path = require('path');
const { mapValues, isString } = require('lodash');

const refRegex = /^(\$[^.]+)\.([a-z0-9-_]+)$/i;

/**
 * Gets a referenced value if one is available
 * @param {String} value
 * @return {Mixed} value
 */
const mapValue = (value, refs) => {
  if (!isString(value)) {
    return value;
  }

  // Check for ref match
  const match = value.toString().match(refRegex);
  if (!match) {
    return value;
  }
  return refs.get(match[1])[match[2]];
};

class FixtureLoader {
  /**
   * @constructor
   * @param {Object} adapter - adapter
   * @param {String} dir - path to YAML files
   */
  constructor (adapter, dir, refs = null) {
    this._adapter = adapter;
    this._dir = dir || __dirname;

    // Tracks references
    this._refs = new Map();

    // add custom calculated data as a reference
    if (refs) {
      this.setRef(refs.name, refs.obj);
    }

    // Tracks created models
    this._models = [];
  }

  /**
   * Adds additional references to the fixture loader
   * This can be used to add additional data points which are not
   * available in the DB
   *
   * @param {String} refName - the reference name, e.g. $someModel
   * @param {Object} obj - key/value pairs
   */
  setRef (refName, obj) {
    return this._refs.set(refName, obj);
  }

  /**
   * Sets initial value for refs
   * @param {Map}
   */
  setRefs (refs) {
    this._refs = refs;
    return this;
  }

  /**
   * Sets initial value for refs
   * @param {Map}
   */
  addRefs (refs) {
    this._refs = new Map([...this._refs, ...refs]);
    return this;
  }

  /**
   * Fetches all set refs
   * @return {Promise<Map>} - refs
   */
  getRefs () {
    return this._refs;
  }

  /**
   * Fetches a single ref
   * @param {String} key
   */
  getRef (key) {
    return this._refs.get(key);
  }

  /**
   * Load fixtures from specified YAML file
   * @param {String} yamlFile
   * @return {Promise<Array>} created Bookshelf models
   */
  async load (yamlFile) {
    const file = path.resolve(this._dir, yamlFile);
    const data = YAML.load(file);
    const { _refs } = this;

    for (const config of data) {
      // Pre-process field data to include references to previously inserted models
      // Models are processed sequentially
      const data = mapValues(config.fields, val => mapValue(val, _refs));

      // Create new model using adapter
      const model = await this._adapter.create(config, data);

      // Store in refs
      if (config.ref) {
        this.setRef(config.ref, model);
      }

      this._models.push(model);
    }
  }
}

module.exports = FixtureLoader;
