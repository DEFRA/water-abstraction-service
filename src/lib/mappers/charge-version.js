'use strict';

const objectMapper = require('object-mapper');

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

const dbToModelMap = {
  chargeVersionId: 'id',
  scheme: 'scheme',
  versionNumber: 'versionNumber',
  status: 'status',
  regionCode: {
    key: 'region',
    transform: createRegion
  },
  startDate: {
    key: 'dateRange',
    transform: (startDate, source) => new DateRange(startDate, source.endDate)
  },
  source: 'source',
  companyId: {
    key: 'company',
    transform: id => new Company(id)
  },
  invoiceAccountId: {
    key: 'invoiceAccount',
    transform: id => new InvoiceAccount(id)
  },
  changeReason: {
    key: 'changeReason',
    transform: changeReasonMapper.dbToModel
  },
  chargeElements: {
    key: 'chargeElements',
    transform: chargeElements => chargeElements.map(chargeElementMapper.dbToModel)
  },
  licence: {
    key: 'licence',
    transform: licenceMapper.dbToModel
  },
  createdBy: {
    key: 'createdBy',
    transform: userMapper.pojoToModel
  },
  approvedBy: {
    key: 'approvedBy',
    transform: userMapper.pojoToModel
  }
};

const dbToModel = row => {
  const model = new ChargeVersion();
  return model.fromHash(
    objectMapper(row, dbToModelMap)
  );
};

const transformUser = user => user && user.toJSON();

const modelToDbMap = {
  id: 'chargeVersionId',
  'licence.licenceNumber': 'licenceRef',
  versionNumber: 'versionNumber',
  'dateRange.startDate': 'startDate',
  'dateRange.endDate': 'endDate',
  status: 'status',
  apportionment: 'apportionment',
  error: 'error',
  billedUpToDate: 'billedUptoDate',
  dateCreated: 'dateCreated',
  dateUpdated: 'dateUpdated',
  source: 'source',
  scheme: 'scheme',
  'region.numericCode': 'regionCode',
  'invoiceAccount.company.id': 'companyId',
  'invoiceAccount.id': 'invoiceAccountId',
  'changeReason.id': 'changeReasonId',
  createdBy: {
    key: 'createdBy',
    transform: transformUser
  },
  approvedBy: {
    key: 'approvedBy',
    transform: transformUser
  }
};

const modelToDb = model => objectMapper(model, modelToDbMap);

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
