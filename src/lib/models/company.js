'use strict';

const Joi = require('@hapi/joi');

const TYPE_PERSON = 'person';
const TYPE_ORGANISATION = 'organisation';

const VALID_TYPE = Joi.string().valid(TYPE_PERSON, TYPE_ORGANISATION).required();
const VALID_NAME = Joi.string().required();

const Model = require('./model');

class Company extends Model {
  /**
   * @param {String} type - Company type person|organisation
   */
  set type (type) {
    Joi.assert(type, VALID_TYPE);
    this._type = type;
  }

  get type () {
    return this._type;
  }

  /**
   * @param {String} type - Company name (or full name if individual)
   */
  set name (name) {
    Joi.assert(name, VALID_NAME);
    this._name = name;
  }

  get name () {
    return this._name;
  }
}

module.exports = Company;
module.exports.TYPE_ORGANISATION = TYPE_ORGANISATION;
module.exports.TYPE_PERSON = TYPE_PERSON;
