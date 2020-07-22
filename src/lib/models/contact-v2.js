'use strict';

const { assertNullableString, assertNullableEnum, assertEnum } = require('./validators');
const Model = require('./model');
const Joi = require('@hapi/joi');
const { omit } = require('lodash');

const CONTACT_TYPES = { person: 'person', department: 'department' };
const DATA_SOURCE_TYPES = { nald: 'nald', wrls: 'wrls' };

const getInitials = (firstName, middleInitials) => middleInitials
  ? `${firstName.slice(0, 1)} ${middleInitials}`
  : null;

const contactPersonSchema = Joi.object({
  title: Joi.string().allow(null).optional(),
  firstName: Joi.string().required(),
  middleInitials: Joi.string().allow(null).optional(),
  lastName: Joi.string().required(),
  suffix: Joi.string().allow(null).optional(),
  department: Joi.string().allow(null).replace(/\./g, '').optional(),
  dataSource: Joi.string().valid(Object.values(DATA_SOURCE_TYPES)).allow(null).optional()
});

const contactDepartmentSchema = Joi.object({
  department: Joi.string().required(),
  dataSource: Joi.string().valid(Object.values(DATA_SOURCE_TYPES)).allow(null).optional()
});

class Contact extends Model {
  set initials (initials) {
    assertNullableString(initials);
    this._initials = initials;
  }

  get initials () {
    return this._initials;
  }

  set middleInitials (middleInitials) {
    assertNullableString(middleInitials);
    this._middleInitials = middleInitials;
  }

  get middleInitials () {
    return this._middleInitials;
  }

  set title (title) {
    assertNullableString(title);
    this._title = title;
  }

  get title () {
    return this._title;
  }

  set firstName (firstName) {
    assertNullableString(firstName);
    this._firstName = firstName;
  }

  get firstName () {
    return this._firstName;
  }

  set lastName (lastName) {
    assertNullableString(lastName);
    this._lastName = lastName;
  }

  get lastName () {
    return this._lastName;
  }

  set suffix (suffix) {
    assertNullableString(suffix);
    this._suffix = suffix;
  }

  get suffix () {
    return this._suffix;
  }

  set department (department) {
    assertNullableString(department);
    this._department = department;
  }

  get department () {
    return this._department;
  }

  set type (type) {
    assertNullableEnum(type, Object.values(CONTACT_TYPES));
    this._type = type;
  }

  get type () {
    return this._type;
  }

  set dataSource (dataSource) {
    assertEnum(dataSource, Object.values(DATA_SOURCE_TYPES));
    this._dataSource = dataSource;
  }

  get dataSource () {
    return this._dataSource;
  }

  /**
   * Gets the contact's full name including title, first name/initial, surname and suffix
   * @return {String}
   */
  get fullName () {
    const initials = this._dataSource === DATA_SOURCE_TYPES.nald ? this._initials : getInitials(this._firstName, this._middleInitials);

    const parts = [this._title, initials || this._firstName, this._lastName, this._suffix];
    return parts.filter(x => x).join(' ');
  }

  toJSON () {
    const data = {
      ...super.toJSON()
    };
    if (this._type === CONTACT_TYPES.person) data.fullName = this.fullName;
    return data;
  }

  isValid () {
    const schema = this._type === CONTACT_TYPES.person ? contactPersonSchema : contactDepartmentSchema;
    return Joi.validate(omit(this.toJSON(), ['type', 'fullName']), schema, { abortEarly: false });
  }
}

module.exports = Contact;
module.exports.CONTACT_TYPES = CONTACT_TYPES;
module.exports.DATA_SOURCE_TYPES = DATA_SOURCE_TYPES;
