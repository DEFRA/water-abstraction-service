const Joi = require('@hapi/joi');

const TYPE_PERSON = 'person';
const TYPE_ORGANISATION = 'organisation';

const VALID_GUID = Joi.string().guid().required();
const VALID_TYPE = Joi.string().valid(TYPE_PERSON, TYPE_ORGANISATION).required();
const VALID_NAME = Joi.string().required();

class Company {
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  get id () {
    return this._id;
  }

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

  toJSON () {
    return {
      id: this._id,
      type: this._type,
      name: this._name
    };
  }
}

module.exports = Company;
module.exports.TYPE_ORGANISATION = TYPE_ORGANISATION;
module.exports.TYPE_PERSON = TYPE_PERSON;
