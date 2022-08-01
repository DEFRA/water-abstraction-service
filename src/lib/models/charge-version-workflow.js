'use strict'

const Model = require('./model')
const validators = require('./validators')
const User = require('./user')
const ChargeVersion = require('./charge-version')
const Licence = require('./licence')

const CHARGE_VERSION_WORKFLOW_STATUS = {
  review: 'review',
  changesRequested: 'changes_requested',
  toSetup: 'to_setup'
}

/**
 * @class Used to the manage the creation, review and approval of a charge version
 */
class ChargeVersionWorkflow extends Model {
  /**
   * The licence the new charge version will relate to
   * @param {Licence}
   */
  set licence (licence) {
    validators.assertIsInstanceOf(licence, Licence)
    this._licence = licence
  }

  get licence () {
    return this._licence
  }

  /**
   * The User who has created the charge version
   * @param {User}
   */
  set createdBy (createdBy) {
    validators.assertIsNullableInstanceOf(createdBy, User)
    this._createdBy = createdBy
  }

  get createdBy () {
    return this._createdBy
  }

  /**
   * Comments from the user who is reviewing the new charge version
   * @param {String}
   */
  set approverComments (approverComments) {
    validators.assertNullableString(approverComments)
    this._approverComments = approverComments
  }

  get approverComments () {
    return this._approverComments
  }

  /**
   * The status of this charge information workflow model
   * @param {String} status - review|changes_requested
   */
  set status (status) {
    validators.assertEnum(status, Object.values(CHARGE_VERSION_WORKFLOW_STATUS))
    this._status = status
  }

  get status () {
    return this._status
  }

  /**
   * The Charge Version model that will be created when this workflow is approved
   * @param {ChargeVersion} chargeVersion - mapped from the data jsonb property
   */
  set chargeVersion (chargeVersion) {
    validators.assertIsNullableInstanceOf(chargeVersion, ChargeVersion)
    this._chargeVersion = chargeVersion
  }

  get chargeVersion () {
    return this._chargeVersion
  }

  /**
   * Created date
   * @param {String} timestamp
   */
  set dateCreated (value) {
    this._dateCreated = this.getDateTimeFromValue(value)
  }

  get dateCreated () {
    return this._dateCreated
  }

  /**
   * Updated date
   * @param {String} timestamp
   */
  set dateUpdated (value) {
    this._dateUpdated = this.getDateTimeFromValue(value)
  }

  get dateUpdated () {
    return this._dateUpdated
  }

  /**
   * Date deleted
   * @param {String} timestamp
   */
  set dateDeleted (value) {
    this._dateDeleted = value === null ? null : this.getDateTimeFromValue(value)
  }

  get dateDeleted () {
    return this._dateDeleted
  }

  /**
   * licence version id
   * @param {String} uuid
   */
  set licenceVersionId (value) {
    validators.assertNullableId(value)
    this._licenceVersionId = value
  }

  get licenceVersionId () {
    return this._licenceVersionId
  }
}

module.exports = ChargeVersionWorkflow
module.exports.CHARGE_VERSION_WORKFLOW_STATUS = CHARGE_VERSION_WORKFLOW_STATUS
