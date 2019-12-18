'use strict';

const { pick } = require('lodash');

const { assertId } = require('./validators');

class Model {
  constructor (id) {
    if (id) {
      this.id = id;
    }
  }

  get id () {
    return this._id;
  }

  set id (id) {
    assertId(id);
    this._id = id;
  }

  fromHash (valueHash) {
    for (const key in valueHash) {
      this[key] = valueHash[key];
    }
  };

  pickFrom (source, keys) {
    this.fromHash(pick(source, keys));
  }

  toJSON () {
    return Object.keys(this).reduce((acc, key) => {
      acc[key.replace('_', '')] = this[key];
      return acc;
    }, {});
  }
}

module.exports = Model;
