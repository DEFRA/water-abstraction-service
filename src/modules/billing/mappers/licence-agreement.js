const Agreement = require('../../../lib/models/agreement');
const DateRange = require('../../../lib/models/date-range');
const LicenceAgreement = require('../../../lib/models/licence-agreement');

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
