'use strict';

const Agreement = require('../models/agreement');
const DateRange = require('../models/date-range');
const LicenceAgreement = require('../models/licence-agreement');

const dbToModel = row => {
  const agreement = new Agreement();
  agreement.code = row.financialAgreementTypeId;

  return new LicenceAgreement().fromHash({
    id: row.licenceAgreementId,
    dateRange: new DateRange(row.startDate, row.endDate),
    agreement,
    dateSigned: row.dateSigned
  });
};

exports.dbToModel = dbToModel;
