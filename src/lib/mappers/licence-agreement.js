'use strict';

const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');
const DateRange = require('../models/date-range');
const LicenceAgreement = require('../models/licence-agreement');

const agreementMapper = require('./agreement');

const dbToModelMapper = createMapper()
  .map('licenceAgreementId').to('id')
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('financialAgreementType').to('agreement', agreementMapper.dbToModel)
  .map('dateSigned').to('dateSigned');

const dbToModel = row => createModel(LicenceAgreement, row, dbToModelMapper);

const modelToDb = (model, licenceRef) => ({
  licenceRef,
  startDate: model.dateRange.startDate,
  endDate: model.dateRange.endDate,
  dateSigned: model.dateSigned,
  financialAgreementTypeId: model.agreement.id
});

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
