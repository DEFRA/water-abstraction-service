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

const mapInvoiceAccountId = id =>
  id ? new InvoiceAccount(id) : null;

const dbToModelMapper = createMapper()
  .map('chargeVersionId').to('id')
  .copy(
    'scheme',
    'versionNumber',
    'status',
    'source'
  )
  .map('regionCode').to('region', createRegion)
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('companyId').to('company', companyId => new Company(companyId))
  .map('invoiceAccountId').to('invoiceAccount', mapInvoiceAccountId)
  .map('changeReason').to('changeReason', changeReasonMapper.dbToModel)
  .map('chargeElements').to('chargeElements', chargeElements => chargeElements.map(chargeElementMapper.dbToModel))
  .map('licence').to('licence', licenceMapper.dbToModel)
  .map('createdBy').to('createdBy', userMapper.pojoToModel)
  .map('approvedBy').to('approvedBy', userMapper.pojoToModel);

const dbToModel = row => {
  return createModel(ChargeVersion, row, dbToModelMapper);
};

const modelToDbMapper = createMapper()
  .map('id').to('chargeVersionId')
  .copy(
    'scheme',
    'versionNumber',
    'status',
    'source',
    'error',
    'apportionment',
    'dateCreated',
    'dateUpdated'
  )
  .map('licence.licenceNumber').to('licenceRef')
  .map('licence.id').to('licenceId')
  .map('billedUpToDate').to('billedUptoDate')
  .map('dateRange.startDate').to('startDate')
  .map('dateRange.endDate').to('endDate')
  .map('region.numericCode').to('regionCode')
  .map('invoiceAccount.company.id').to('companyId')
  .map('invoiceAccount.id').to('invoiceAccountId')
  .map('changeReason.id').to('changeReasonId')
  .map('createdBy').to('createdBy', userMapper.modelToDb)
  .map('approvedBy').to('approvedBy', userMapper.modelToDb);

const modelToDb = model => modelToDbMapper.execute(model);

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'licenceRef',
    'scheme',
    'externalId',
    'versionNumber',
    'status'
  )
  .map('dateRange').to('dateRange', dateRangeMapper.pojoToModel)
  .map('changeReason').to('changeReason', changeReasonMapper.pojoToModel)
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
