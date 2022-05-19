'use strict'

const Model = require('./model')

const validators = require('./validators')

const eventTypes = {
  notification: 'notification'
}

class Event extends Model {
  constructor (id) {
    super(id)
    this._licences = []
  }

  /**
   * Sets the code for this event
   * @param {String} referenceCode
   */
  set referenceCode (referenceCode) {
    this._referenceCode = referenceCode
  }

  /**
   * Gets the reference code for this event
   * @return {String}
   */
  get referenceCode () {
    return this._referenceCode
  }

  /**
   * Sets the type for this event
   * not nullable database constraint
   * @param {String} type
   */
  set type (type) {
    validators.assertString(type)
    this._type = type
  }

  /**
   * Gets the type for this event
   * @return {String}
   */
  get type () {
    return this._type
  }

  /**
   * Sets the subtype for this event
   * @param {String} subtype
   */
  set subtype (subtype) {
    validators.assertNullableString(subtype)
    this._subtype = subtype
  }

  /**
   * Gets the subtype for this event
   * @return {String}
   */
  get subtype () {
    return this._subtype
  }

  /**
     * Sets the issuer for this event
     * @param {String} issuer
     */
  set issuer (issuer) {
    validators.assertNullableString(issuer)
    this._issuer = issuer
  }

  /**
   * Gets the issuer for this event
   * @return {String}
   */
  get issuer () {
    return this._issuer
  }

  /**
     * Sets the licences for this event
     * @param {Licence} Licence
     */
  set licences (licences) {
    validators.assertIsArrayOfNullableStrings(licences)
    this._licences = licences
  }

  /**
    * Gets the licences for this event
    * @return {String}
    */
  get licences () {
    return this._licences
  }

  /**
     * Sets the entities for this event
     * @param {Object} entities
     */
  set entities (entities) {
    validators.assertIsNullableInstanceOf(entities, Object)
    this._entities = entities
  }

  /**
    * Gets the event type for this event
    * @return {Object}
    */
  get entities () {
    return this._entities
  }

  /**
   * Sets the event type for this event
   * @param {String} comment
   */
  set comment (comment) {
    validators.assertNullableString(comment)
    this._comment = comment
  }

  /**
   * Gets the comment for this event
   * @return {String}
   */
  get comment () {
    return this._comment
  }

  /**
   * Sets the metadata for this event
   * @param {Object} metadata
   */
  set metadata (metadata) {
    validators.assertIsNullableInstanceOf(metadata, Object)
    this._metadata = metadata
  }

  /**
   * Gets the metadata for this event
   * @return {Object}
   */
  get metadata () {
    return this._metadata
  }

  /**
   * Sets the status for this event
   * @param {String} status
   */
  set status (status) {
    validators.assertNullableString(status)
    this._status = status
  }

  /**
   * Gets the status for this event
   * @return {String}
   */
  get status () {
    return this._status
  }

  /**
   * Sets the created date for this event
   * @param {string} created
   */
  set created (created) {
    this._created = this.getDateTimeFromValue(created)
  }

  /**
   * Gets the date created for this event
   * @return {string}
   */
  get created () {
    return this._created
  }

  /**
   * Sets the modified date for this event
   * @param {string} modified
   */
  set modified (modified) {
    this._modified = this.getDateTimeFromValue(modified)
  }

  /**
   * Gets the date modified for this event
   * @return {string}
   */
  get modified () {
    return this._modified
  }
}

module.exports = Event
module.exports.eventTypes = eventTypes
