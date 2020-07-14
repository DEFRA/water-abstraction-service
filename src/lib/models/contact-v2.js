'use strict';

const { assertNullableString, assertNullableEnum, assertEnum } = require('./validators');
const Model = require('./model');

const CONTACT_TYPES = ['person', 'department'];
const DATA_SOURCE_TYPES = ['nald', 'wrls'];

const getInitials = (firstName, middleInitials) => middleInitials
  ? `${firstName.slice(0, 1)} ${middleInitials}`
  : null;

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
    assertNullableEnum(type, CONTACT_TYPES);
    this._type = type;
  }

  get type () {
    return this._type;
  }

  set dataSource (dataSource) {
    assertEnum(dataSource, DATA_SOURCE_TYPES);
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
    const initials = this._dataSource === 'nald' ? this._initials : getInitials(this._firstName, this._middleInitials);

    const parts = [this._title, initials || this._firstName, this._lastName];
    const name = parts.filter(x => x).join(' ');
    return this._suffix ? `${name}, ${this._suffix}` : name;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      fullName: this.fullName
    };
  }
}

module.exports = Contact;
