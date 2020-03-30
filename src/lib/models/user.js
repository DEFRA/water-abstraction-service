'use strict';

const Model = require('./model');
const { assertPositiveInteger, assertEmailAddress } = require('./validators');

class User extends Model {
  /**
   * @param {Integer} id - user id
   */
  set id (id) {
    assertPositiveInteger(id);
    this._id = id;
  }

  get id () {
    return this._id;
  }

  /**
   * @param {String} type - user email address
   */
  set emailAddress (emailAddress) {
    assertEmailAddress(emailAddress);
    this._emailAddress = emailAddress;
  }

  get emailAddress () {
    return this._emailAddress;
  }
}

module.exports = User;
