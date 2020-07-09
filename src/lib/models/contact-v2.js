'use strict';

const { assertNullableString, assertNullableEnum } = require('./validators');
const Model = require('./model');

const CONTACT_TYPES = ['person', 'department'];

class Contact extends Model {
  set initials (initials) {
    assertNullableString(initials);
    this._initials = initials;
  }

  get initials () {
    return this._initials;
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

  /**
   * Gets the contact's full name including title, first name/initial, surname and suffix
   * @return {String}
   */
  get fullName () {
    const parts = [this._title, this._initials || this._firstName, this._lastName];
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
