'use strict';

const DateRange = require('../models/date-range');
const LicenceAgreement = require('../models/licence-agreement');

const agreementMapper = require('./agreement');

const dbToModel = row => {
  return new LicenceAgreement().fromHash({
    id: row.licenceAgreementId,
    dateRange: new DateRange(row.startDate, row.endDate),
    agreement: agreementMapper.dbToModel(row.financialAgreementType),
    dateSigned: row.dateSigned
  });
};

exports.dbToModel = dbToModel;
