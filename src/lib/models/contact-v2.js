const Joi = require('@hapi/joi');
const VALID_NULLABLE_STRING = Joi.string().required().allow(null);
const VALID_GUID = Joi.string().guid().required();

class Contact {
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  get id () {
    return this._id;
  }

  set initials (initials) {
    Joi.assert(initials, VALID_NULLABLE_STRING);
    this._initials = initials;
  }

  get initials () {
    return this._initials;
  }

  set salutation (salutation) {
    Joi.assert(salutation, VALID_NULLABLE_STRING);
    this._salutation = salutation;
  }

  get salutation () {
    return this._salutation;
  }

  set firstName (firstName) {
    Joi.assert(firstName, VALID_NULLABLE_STRING);
    this._firstName = firstName;
  }

  get firstName () {
    return this._firstName;
  }

  set lastName (lastName) {
    Joi.assert(lastName, VALID_NULLABLE_STRING);
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
      id: this._id,
      salutation: this._salutation,
      initials: this._initials,
      firstName: this._firstName,
      lastName: this._lastName
    };
  }
}

module.exports = Contact;
