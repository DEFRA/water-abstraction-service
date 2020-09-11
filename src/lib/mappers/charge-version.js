'use strict';

const { createMapper } = require('../object-mapper');

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
const dateRangeMapper = require('./date-range');

const { createModel } = require('./lib/helpers');

const createRegion = regionCode => {
  const region = new Region();
  return region.fromHash({
    numericCode: regionCode,
    type: Region.types.region
  });
};

const dbToModelMapper = createMapper()
  .map('chargeVersionId').to('id')
  .map('scheme').to('scheme')
  .map('versionNumber').to('versionNumber')
  .map('status').to('status')
  .map('regionCode').to('region', createRegion)
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('source').to('source')
  .map('companyId').to('company', companyId => new Company(companyId))
  .map('invoiceAccountId').to('invoiceAccount', invoiceAccountId => new InvoiceAccount(invoiceAccountId))
  .map('changeReason').to('changeReason', changeReasonMapper.dbToModel)
  .map('chargeElements').to('chargeElements', chargeElements => chargeElements.map(chargeElementMapper.dbToModel))
  .map('licence').to('licence', licenceMapper.dbToModel)
  .map('createdBy').to('createdBy', userMapper.pojoToModel)
  .map('approvedBy').to('approvedBy', userMapper.pojoToModel);

const dbToModel = row => createModel(ChargeVersion, row, dbToModelMapper);

const modelToDbMapper = createMapper()
  .map('id').to('chargeVersionId')
  .map('licence.licenceNumber').to('licenceRef')
  .map('versionNumber').to('versionNumber')
  .map('dateRange.startDate').to('startDate')
  .map('dateRange.endDate').to('endDate')
  .map('status').to('status')
  .map('apportionment').to('apportionment')
  .map('error').to('error')
  .map('billedUpToDate').to('billedUptoDate')
  .map('dateCreated').to('dateCreated')
  .map('dateUpdated').to('dateUpdated')
  .map('source').to('source')
  .map('scheme').to('scheme')
  .map('region.numericCode').to('regionCode')
  .map('invoiceAccount.company.id').to('companyId')
  .map('invoiceAccount.id').to('invoiceAccountId')
  .map('changeReason.id').to('changeReasonId')
  .map('createdBy').to('createdBy', userMapper.modelToDb)
  .map('approvedBy').to('approvedBy', userMapper.modelToDb);

const modelToDb = model => modelToDbMapper.execute(model);

const pojoToModelMapper = createMapper()
  .map('id').to('id')
  .map('licenceRef').to('licenceRef')
  .map('scheme').to('scheme')
  .map('externalId').to('externalId')
  .map('versionNumber').to('versionNumber')
  .map('status').to('status')
  .map('dateRange').to('dateRange', dateRangeMapper.pojoToModel)
  .map('chargeElements').to('chargeElements', chargeElements => chargeElements.map(chargeElementMapper.pojoToModel))
  .map('invoiceAccount').to('invoiceAccount', invoiceAccountMapper.pojoToModel)
  .map('createdBy').to('createdBy', userMapper.pojoToModel)
  .map('approvedBy').to('approvedBy', userMapper.pojoToModel);

/**
 * Converts a plain object representation of a ChargeVersion to a ChargeVersion model
 * @param {Object} pojo
 * @return ChargeVersion
 */
const pojoToModel = pojo => createModel(ChargeVersion, pojo, pojoToModelMapper);

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
exports.pojoToModel = pojoToModel;
