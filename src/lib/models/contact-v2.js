'use strict';

const { assertNullableString, assertNullableEnum, assertEnum, assertNullableStringAllowEmpty } = require('./validators');
const Model = require('./model');
const Joi = require('joi');
const { omit } = require('lodash');

const CONTACT_TYPES = { person: 'person', department: 'department' };
const DATA_SOURCE_TYPES = { nald: 'nald', wrls: 'wrls' };

const getInitials = (firstName, middleInitials) => middleInitials
  ? `${firstName.slice(0, 1)} ${middleInitials}`
  : null;

const contactPersonSchema = Joi.object({
  salutation: Joi.string().allow(null).optional(),
  firstName: Joi.string().required(),
  initials: Joi.string().allow(null).optional(),
  middleInitials: Joi.string().allow(null).optional(),
  lastName: Joi.string().required(),
  suffix: Joi.string().allow(null).optional(),
  department: Joi.string().allow(null).replace(/\./g, '').optional(),
  dataSource: Joi.string().valid(...Object.values(DATA_SOURCE_TYPES)).required(),
  isTest: Joi.boolean().optional().default(false)
});

const contactDepartmentSchema = Joi.object({
  department: Joi.string().required(),
  dataSource: Joi.string().valid(...Object.values(DATA_SOURCE_TYPES)).required(),
  isTest: Joi.boolean().optional().default(false)
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
    assertNullableStringAllowEmpty(middleInitials);
    this._middleInitials = middleInitials;
  }

  get middleInitials () {
    return this._middleInitials;
  }

  set salutation (salutation) {
    assertNullableStringAllowEmpty(salutation);
    this._salutation = salutation;
  }

  get salutation () {
    return this._salutation;
  }

  set firstName (firstName) {
    assertNullableStringAllowEmpty(firstName);
    this._firstName = firstName;
  }

  get firstName () {
    return this._firstName;
  }

  set lastName (lastName) {
    assertNullableStringAllowEmpty(lastName);
    this._lastName = lastName;
  }

  get lastName () {
    return this._lastName;
  }

  set suffix (suffix) {
    assertNullableStringAllowEmpty(suffix);
    this._suffix = suffix;
  }

  get suffix () {
    return this._suffix;
  }

  set department (department) {
    assertNullableStringAllowEmpty(department);
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
   * Gets the contact's full name including salutation, first name/initial, surname and suffix
   * @return {String}
   */
  get fullName () {
    if (this.type === CONTACT_TYPES.department) {
      return this.department;
    }

    const initials = this._dataSource === DATA_SOURCE_TYPES.nald ? this._initials : getInitials(this._firstName, this._middleInitials);

    const parts = [this._salutation, initials || this._firstName, this._lastName, this._suffix];
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
    return schema.validate(omit(this.toJSON(), ['type', 'fullName']), { abortEarly: false });
  }
}

module.exports = Contact;
module.exports.CONTACT_TYPES = CONTACT_TYPES;
module.exports.DATA_SOURCE_TYPES = DATA_SOURCE_TYPES;
