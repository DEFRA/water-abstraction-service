const { createGUID } = require('./helpers');
const moment = require('moment');
const { pool } = require('./connectors/db');
const Repository = require('hapi-pg-rest-api/src/repository');

const event = new Repository({
  connection: pool,
  table: 'water.events',
  primaryKey: 'event_id'
});

/**
 * Make a random string of given length, from pre-defined list of chars
 * to avoid confusion - e.g don't include O and 0
 * @see {@link https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript}
 * @param {Number} length - the length of the random string
 * @return {String}
 */
function randomString (length) {
  let text = '';
  let possible = 'ABCDEFGHJKLMNPQRTUVWXYZ0123456789';
  for (let i = 0; i < length; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
  return text;
}

class Event {
  constructor () {
    this.data = {
      event_id: null,
      reference_code: null,
      type: null,
      subtype: null,
      issuer: null,
      licences: '[]',
      entities: '[]',
      comment: null,
      metadata: '{}',
      status: null,
      created: moment().format('YYYY-MM-DD HH:mm:ss')
    };
  }

  /**
   * Gets the event ID guid
   * @return {String}
   */
  getId () {
    return this.data.event_id;
  }

  /**
   * Get next reference number with a pre-defined prefix
   * @param {String} prefix - the prefix for the reference, e.g. EXPIRY-
   * @return {String} the next prefix
   */
  generateReference (prefix) {
    if (!prefix) {
      return null;
    }
    this.data.reference_code = prefix + randomString(6);
    return this;
  }

  /**
   * Gets the reference for this batch
   * @return {String}
   */
  getReference () {
    return this.data.reference_code;
  }

  /**
   * Sets type, subtype
   * @param {String} type
   * @param {String} subtype
   * @return {this}
   */
  setType (type, subtype = null) {
    this.data.type = type;
    this.data.subtype = subtype;
    return this;
  }

  /**
   * Sets licence numbers this event relates to
   * @param {Array} licences
   * @return {this}
   */
  setLicenceNumbers (licences) {
    this.data.licences = JSON.stringify(licences);
    return this;
  }

  /**
   * Sets entities this event relates to
   * @param {Array} entities
   * @return {this}
   */
  setEntities (entities) {
    this.data.entities = JSON.stringify(entities);
    return this;
  }

  /**
   * Sets additional metadata for this event
   * @param {Array} entities
   * @return {this}
   */
  setMetadata (metadata) {
    this.data.metadata = JSON.stringify(metadata);
    return this;
  }

  /**
   * Sets the issuer email address
   * @param {String} email
   * @return this
   */
  setIssuer (emailAddress) {
    this.data.issuer = emailAddress;
    return this;
  }

  /**
   * Sets the status of the event
   * @param {String} status
   * @return this
   */
  setStatus (status) {
    this.data.status = status;
    return this;
  }

  /**
   * Saves record to DB
   * @return {Promise} resolves on save/error
   */
  save () {
    if (!this.data.event_id) {
      this.data.event_id = createGUID();
      return event.create(this.data);
    }
    this.data.modified = moment().format('YYYY-MM-DD HH:mm:ss');
    return event.update({ event_id: this.data.event_id }, this.data);
  }
}

module.exports = Event;
