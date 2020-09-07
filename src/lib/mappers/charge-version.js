'use strict';

const { isEmpty, negate } = require('lodash');
const isNotEmpty = negate(isEmpty);

const ChargeVersion = require('../models/charge-version');
const Company = require('../models/company');
const DateRange = require('../models/date-range');
const InvoiceAccount = require('../models/invoice-account');
const Region = require('../models/region');

const changeReasonMapper = require('./change-reason');
const chargeElementMapper = require('./charge-element');
const licenceMapper = require('./licence');
const invoiceAccountMapper = require('./invoice-account');
const userMapper = require('./user');

const createRegion = regionCode => {
  const region = new Region();
  return region.fromHash({
    numericCode: regionCode,
    type: Region.types.region
  });
};

const dbToModel = row => {
  const model = new ChargeVersion();

  model.fromHash({
    id: row.chargeVersionId,
    scheme: row.scheme,
    versionNumber: row.versionNumber,
    dateRange: new DateRange(row.startDate, row.endDate),
    status: row.status,
    region: createRegion(row.regionCode),
    source: row.source,
    company: new Company(row.companyId),
    invoiceAccount: new InvoiceAccount(row.invoiceAccountId),
    changeReason: changeReasonMapper.dbToModel(row.changeReason)
  });

  if (row.chargeElements) {
    model.chargeElements = row.chargeElements.map(chargeElementMapper.dbToModel);
  }

  if (isNotEmpty(row.licence)) {
    model.licence = licenceMapper.dbToModel(row.licence);
  }

  if (row.createdBy) {
    model.createdBy = userMapper.dbToModel(row.createdBy);
  }
  if (row.approvedBy) {
    model.approvedBy = userMapper.dbToModel(row.approvedBy);
  }

  return model;
};

const modelToDb = model => {
  const dbRow = {
    chargeVersionId: model.id,
    licenceRef: model.licence.licenceNumber,
    versionNumber: model.versionNumber,
    startDate: model.dateRange.startDate,
    endDate: model.dateRange.endDate,
    status: model.status,
    apportionment: model.apportionment,
    error: model.error,
    billedUptoDate: model.billedUpToDate,
    dateCreated: model.dateCreated,
    dateUpdated: model.dateUpdated,
    source: model.source,
    scheme: model.scheme,
    regionCode: model.region.numericCode,
    // @todo remove companyId from charge version
    companyId: model.invoiceAccount.company.id,
    invoiceAccountId: model.invoiceAccount.id
  };

  if (model.changeReason) {
    dbRow.changeReasonId = model.changeReason.id;
  }

  if (model.createdBy) {
    dbRow.createdBy = model.createdBy.toJSON();
  }
  if (model.approvedBy) {
    dbRow.approvedBy = model.approvedBy.toJSON();
  }

  return dbRow;
};

/**
 * Converts a plain object representation of a ChargeVersion to a ChargeVersion model
 * @param {Object} pojo
 * @return ChargeVersion
 */
const pojoToModel = pojo => {
  const model = new ChargeVersion();

  model.pickFrom(pojo, ['id', 'licenceRef', 'scheme', 'externalId', 'versionNumber', 'status']);

  if (pojo.dateRange) {
    model.dateRange = new DateRange(pojo.dateRange.startDate, pojo.dateRange.endDate);
  }
  if (pojo.chargeElements) {
    model.chargeElements = pojo.chargeElements.map(chargeElementMapper.pojoToModel);
  }
  if (pojo.invoiceAccount) {
    model.invoiceAccount = invoiceAccountMapper.pojoToModel(pojo.invoiceAccount);
  }
  if (pojo.createdBy) {
    model.createdBy = userMapper.pojoToModel(pojo.createdBy);
  }
  if (pojo.approvedBy) {
    model.approvedBy = userMapper.pojoToModel(pojo.approvedBy);
  }

  return model;
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.pojoToModel = pojoToModel;
