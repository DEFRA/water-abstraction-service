const Joi = require('@hapi/joi');
const BillingInvoice = require('./billing-invoice');

const VALID_GUID = Joi.string().guid().required();
const VALID_BATCH_TYPE = Joi.string().valid('annual', 'supplementary', 'two_part_tariff').required();
const VALID_SEASON = Joi.string().valid('summer', 'winter', 'all year').required();
const VALID_YEAR = Joi.string().pattern(/^[0-9]{4}$/).required();
const VALID_STATUS = Joi.string().valid('processing', 'complete', 'error').required();

class BillingBatch {
  constructor() {
    this._billingInvoices = [];
  }

  set id(id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  get id() {
    return this._id;
  }

  set regionId(regionId) {
    Joi.assert(regionId, VALID_GUID);
    this._regionId = regionId;
  }

  get regionId() {
    return this._regionId;
  }

  set batchType(batchType) {
    Joi.assert(batchType, VALID_BATCH_TYPE);
    this._batchType = batchType;
  }

  get batchType() {
    return this._batchType;
  }

  set season(season) {
    Joi.assert(season, VALID_SEASON);
    this._season = season;
  }

  get season() {
    return this._season;
  }

  set startYear(startYear) {
    Joi.assert(startYear, VALID_YEAR);
    this._startYear = startYear;
  }

  get startYear() {
    return this._startYear;
  }

  set endYear(endYear) {
    Joi.assert(endYear, VALID_YEAR);
    this._endYear = endYear;
  }

  get endYear() {
    return this._endYear;
  }

  set status(status) {
    Joi.assert(status, VALID_STATUS);
    this._status = status;
  }

  get status(status) {
    return _this.status;
  }

  addBillingInvoice(billingInvoice) {
    if (!(billingInvoice instanceof BillingInvoice)) {
      throw new Error('Instance of BillingInvoice expected');
    }
    this._billingInvoices.push(billingInvoice);
    return this;
  }

  get billingInvoices() {
    return this._billingInvoices;
  }
}


module.exports = BillingBatch;
