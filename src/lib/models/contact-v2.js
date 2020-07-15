'use strict';

const { assertNullableString } = require('./validators');
const Model = require('./model');

class Contact extends Model {
  set initials (initials) {
    assertNullableString(initials);
    this._initials = initials;
  }

  get initials () {
    return this._initials;
  }

  set salutation (salutation) {
    assertNullableString(salutation);
    this._salutation = salutation;
  }

  get salutation () {
    return this._salutation;
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

  /**
   * Gets the contact's full name including salutation, first name/initial and surname
   * @return {String}
   */
  get fullName () {
    const parts = [this._salutation, this._initials || this._firstName, this._lastName];
    return parts.filter(x => x).join(' ');
  }

  toJSON () {
    return {
      ...super.toJSON(),
      fullName: this.fullName
    };
  }
}

module.exports = Contact;
