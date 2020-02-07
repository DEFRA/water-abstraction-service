const Model = require('./model');
const Licence = require('./licence');
const { assertIsArrayOfType, assertIsInstanceOf } = require('./validators');

class Event extends Model {
  constructor (id) {
    super(id);
    this._licences = [];
  }

  /**
   * Sets the code for this event
   * @param {String} referenceCode
   */
  set referenceCode (referenceCode) {
    this._referenceCode = referenceCode;
  }

  /**
   * Gets the reference code for this event
   * @return {String}
   */
  get referenceCode () {
    return this._referenceCode;
  }

  /**
   * Sets the type for this event
   * @param {String} type
   */
  set type (type) {
    this._type = type;
  }

  /**
   * Gets the type for this event
   * @return {String}
   */
  get type () {
    return this._type;
  }

  /**
   * Sets the subtype for this event
   * @param {String} subtype
   */
  set subtype (subtype) {
    this._subtype = subtype;
  }

  /**
   * Gets the subtype for this event
   * @return {String}
   */
  get subtype () {
    return this._subtype;
  }

  /**
     * Sets the issuer for this event
     * @param {String} issuer
     */
  set issuer (issuer) {
    this._issuer = issuer;
  }

  /**
   * Gets the issuer for this event
   * @return {String}
   */
  get issuer () {
    return this._issuer;
  }

  /**
     * Sets the licences for this event
     * @param {Licence} Licence
     */
  set licences (licences) {
    assertIsArrayOfType(licences, Licence);
    this._licences = licences;
  }

  /**
    * Gets the licences for this event
    * @return {String}
    */
  get licences () {
    return this._licences;
  }

  /**
     * Sets the entities for this event
     * @param {Object} entities
     */
  set entities (entities) {
    assertIsInstanceOf(entities, Object);
    this._entities = entities;
  }

  /**
    * Gets the event type for this event
    * @return {Object}
    */
  get entities () {
    return this._entities;
  }

  /**
   * Sets the event type for this event
   * @param {String} comment
   */
  set comment (comment) {
    this._comment = comment;
  }

  /**
   * Gets the comment for this event
   * @return {String}
   */
  get comment () {
    return this._comment;
  }

  /**
     * Sets the metaData for this event
     * @param {String} metaData
     */
  set metaData (metaData) {
    this._metaData = metaData;
  }

  /**
   * Gets the metaData for this event
   * @return {String}
   */
  get metaData () {
    return this._metaData;
  }

  /**
   * Sets the status for this event
   * @param {String} status
   */
  set status (status) {
    this._status = status;
  }

  /**
   * Gets the status for this event
   * @return {String}
   */
  get status () {
    return this._status;
  }

  /**
   * Sets the created date for this event
   * @param {string} created
   */
  set created (created) {
    this._created = this.getDateTimeFromValue(created);
  }

  /**
   * Gets the date created for this event
   * @return {string}
   */
  get created () {
    return this._created;
  }

  /**
   * Sets the modified date for this event
   * @param {string} modified
   */
  set modified (modified) {
    this._modified = this.getDateTimeFromValue(modified);
  }

  /**
   * Gets the date modified for this event
   * @return {string}
   */
  get modified () {
    return this._modified;
  }
}

module.exports = Event;
