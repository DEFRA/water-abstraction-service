'use strict';

const Model = require('./model');
const validators = require('./validators');
const User = require('./user');
const ChargeVersion = require('./charge-version');
const Licence = require('./licence');

const CHARGE_VERSION_WORKFLOW_STATUS = {
  draft: 'draft',
  changesRequested: 'changes_requested'
};

/**
 * @class Used to the manage the creation, review and approval of a charge version
 */
class ChargeVersionWorkflow extends Model {
  /**
   * The licence the new charge version will relate to
   * @param {Licence}
   */
  set licence (licence) {
    validators.assertIsInstanceOf(licence, Licence);
    this._licence = licence;
  }

  get licence () {
    return this._licence;
  }

  /**
   * The User who has created the charge version
   * @param {User}
   */
  set createdBy (createdBy) {
    validators.assertIsNullableInstanceOf(createdBy, User);
    this._createdBy = createdBy;
  }

  get createdBy () {
    return this._createdBy;
  }

  /**
   * Comments from the user who is reviewing the new charge version
   * @param {String}
   */
  set approverComments (approverComments) {
    validators.assertNullableString(approverComments);
    this._approverComments = approverComments;
  }

  get approverComments () {
    return this._approverComments;
  }

  /**
   * The status of this charge information workflow model
   * @param {String} status - draft|changes_requested
   */
  set status (status) {
    validators.assertEnum(status, Object.values(CHARGE_VERSION_WORKFLOW_STATUS));
    this._status = status;
  }

  get status () {
    return this._status;
  }

  /**
   * The Charge Version model that will be created when this workflow is approved
   * @param {ChargeVersion} chargeVersion - mapped from the data jsonb property
   */
  set chargeVersion (chargeVersion) {
    validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
    this._chargeVersion = chargeVersion;
  }

  get chargeVersion () {
    return this._chargeVersion;
  }

  /**
   * Created date
   * @param {String} timestamp
   */
  set dateCreated (value) {
    this._dateCreated = this.getDateTimeFromValue(value);
  }

  get dateCreated () {
    return this._dateCreated;
  }

  /**
   * Updated date
   * @param {String} timestamp
   */
  set dateUpdated (value) {
    this._dateUpdated = this.getDateTimeFromValue(value);
  }

  get dateUpdated () {
    return this._dateUpdated;
  }
}

module.exports = ChargeVersionWorkflow;
module.exports.CHARGE_VERSION_WORKFLOW_STATUS = CHARGE_VERSION_WORKFLOW_STATUS;
