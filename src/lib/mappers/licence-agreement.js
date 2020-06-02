const Agreement = require('../models/agreement');
const DateRange = require('../models/date-range');
const LicenceAgreement = require('../models/licence-agreement');

const dbToModel = row => {
  const licenceAgreement = new LicenceAgreement();
  const agreement = new Agreement();
  agreement.code = row.financialAgreementTypeId;
  return licenceAgreement.fromHash({
    id: row.licenceAgreementId,
    dateRange: new DateRange(row.startDate, row.endDate),
    agreement
  });
};

exports.dbToModel = dbToModel;
