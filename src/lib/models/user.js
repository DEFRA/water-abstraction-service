'use strict'

const Model = require('./model')
const { assertPositiveInteger, assertEmailAddress } = require('./validators')

class User extends Model {
  constructor (id, email) {
    super(id)
    this.email = email
  }

  /**
   * @param {Integer} id - user id
   */
  set id (id) {
    assertPositiveInteger(id)
    this._id = id
  }

  get id () {
    return this._id
  }

  /**
   * @param {String} type - user email address
   */
  set email (email) {
    assertEmailAddress(email)
    this._email = email
  }

  get email () {
    return this._email
  }
}

module.exports = User
