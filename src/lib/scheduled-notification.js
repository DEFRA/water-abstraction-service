/**
 * Rewrite of original scheduled notification code to include more advanced
 * logging capabilities
 */
/* eslint camelcase: "warn" */

const NotifyClient = require('notifications-node-client').NotifyClient;
const { createGUID } = require('./helpers');
const moment = require('moment');
const { pool } = require('./connectors/db');
const Repository = require('hapi-pg-rest-api/src/repository');

class NotifyTemplateNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NotifyTemplateNotFoundError';
  }
}

class ScheduledNotification {
  constructor () {
    // Notify client
    this.client = null;

    // Message data for storage in local DB
    this.data = {
      id: null,
      recipient: null,
      message_type: null,
      message_ref: null,
      personalisation: '{}',
      send_after: moment().format('YYYY-MM-DD HH:mm:ss'),
      status: null, // must be null to send initially
      log: null,
      licences: '[]',
      individual_entity_id: null,
      company_entity_id: null,
      notify_id: null,
      notify_status: null,
      plaintext: null,
      event_id: null,
      metadata: '{}'
    };

    this.scheduledNotification = new Repository({
      connection: pool,
      table: 'water.scheduled_notification',
      primaryKey: 'id'
    });

    this.notifyTemplate = new Repository({
      connection: pool,
      table: 'water.notify_templates',
      primaryKey: 'message_ref'
    });
  }

  /**
   * A function to get the notify key
   * The key stored in the DB can be an actual key, or it can refer
   * to an environment variable as follows:
   * test:  TEST_NOTIFY_KEY
   * whitelist: WHITELIST_NOTIFY_KEY
   * live: LIVE_NOTIFY_KEY
   * @param {String} a reference to a notify key: test|whitelist|live to be
   *                 loaded from environment variable, or a full key
   * @return {String} notify key
   */
  getNotifyKey (key) {
    const lKey = key.toLowerCase();
    const keys = {
      test: process.env.TEST_NOTIFY_KEY,
      whitelist: process.env.WHITELIST_NOTIFY_KEY,
      live: process.env.LIVE_NOTIFY_KEY
    };
    if (lKey in keys) {
      return keys[lKey];
    }
    return key;
  }

  /**
   * Sets the message to send
   * throws error if unsuccessful
   * @param {String} messageRef - this is the message reference in our local database
   */
  async setMessage (messageRef) {
    const { rows: [template], error } = await this.notifyTemplate.find({ message_ref: messageRef });

    if (error) {
      throw error;
    }
    if (!template) {
      throw new NotifyTemplateNotFoundError(`Message ref ${messageRef} not found in database`);
    }

    // Check template exists in notify
    this.client = new NotifyClient(this.getNotifyKey(template.notify_key));

    // check template exists in notify
    const notifyTemplate = await this.client.getTemplateById(template.template_id);

    // All OK
    this.data.message_ref = messageRef;
    this.data.message_type = notifyTemplate.body.type;
  }

  /**
   * Set the recipient - email/SMS only
   * @param {String} recipient's email/mobile number
   * @return {this}
   */
  setRecipient (recipient) {
    this.data.recipient = recipient || 'n/a';
    return this;
  }

  /**
   * Sets personalisation data
   * @param {Object} personalisation
   * @return {this}
   */
  setPersonalisation (personalisation) {
    this.data.personalisation = JSON.stringify(personalisation);
    return this;
  }

  /**
   * Sets send after date
   * @param {String} sendAfter - format YYYY-MM-DD HH:mm:ss
   * @return {this}
   */
  setSendAfter (sendAfter) {
    this.data.send_after = sendAfter;
    return this;
  }

  /**
   * Sets message status - pending|sent|error
   * @param {String} status
   * @return {this}
   */
  setStatus (status) {
    this.data.status = status;
  }

  /**
   * Sets licences
   * @param {Array} licences - an array of licence numbers this message relates to
   * @return {this}
   */
  setLicenceNumbers (licences) {
    this.data.licences = JSON.stringify(licences);
    return this;
  }

  /**
   * Sets individual entity ID this message relates to
   * @param {String} entity ID guid
   * @return this
   */
  setIndividualEntityId (guid) {
    this.data.individual_entity_id = guid;
    return this;
  }

  /**
   * Sets company entity ID this message relates to
   * param {String} guid
   * @return this
   */
  setCompanyEntityId (guid) {
    this.data.company_entity_id = guid;
    return this;
  }

  /**
   * Sets the text version of the message sent for logging/audit purposes
   * @param {String} text - the message text, with optional MarkDown formatting
   * @return this
   */
  setText (text) {
    this.data.plaintext = text;
    return this;
  }

  /**
   * Sets the event ID
   * @param {String} guid - the event ID in the event log
   * @return this
   */
  setEventId (guid) {
    this.data.event_id = guid;
    return this;
  }

  /**
   * Sets metadata to store with this message
   * @param {Object} data
   * @return this
   */
  setMetadata (data) {
    this.data.metadata = JSON.stringify(data);
    return this;
  }

  /**
   * Saves record to DB
   * @return {Promise} resolves on save/error
   */
  save () {
    console.log('Scheduling notification', this.data);
    if (!this.data.id) {
      this.data.id = createGUID();
      return this.scheduledNotification.create(this.data);
    }
    return this.scheduledNotification.update({ id: this.data.id }, this.data);
  }
}

module.exports = ScheduledNotification;
