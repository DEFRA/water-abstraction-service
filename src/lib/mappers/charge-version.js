'use strict';

const { isEmpty, negate } = require('lodash');
const isNotEmpty = negate(isEmpty);

const ChargeVersion = require('../models/charge-version');
const Company = require('../models/company');
const DateRange = require('../models/date-range');
const InvoiceAccount = require('../models/invoice-account');
const Region = require('../models/region');

const chargeElementMapper = require('./charge-element');
const licenceMapper = require('./licence');

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
    chargeElements: row.chargeElements.map(chargeElementMapper.dbToModel)
  });

  if (isNotEmpty(row.licence)) {
    model.licence = licenceMapper.dbToModel(row.licence);
  }

  return model;
};

const modelToDb = model => {
  return {
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
    companyId: model.company.id,
    invoiceAccountId: model.invoiceAccount.id
  };
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
