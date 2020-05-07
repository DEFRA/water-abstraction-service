const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period');
const Batch = require('../../../../../src/lib/models/batch');
const ChargeElement = require('../../../../../src/lib/models/charge-element');
const ChargeVersion = require('../../../../../src/lib/models/charge-version');
const DateRange = require('../../../../../src/lib/models/date-range');
const Licence = require('../../../../../src/lib/models/licence');
const FinancialYear = require('../../../../../src/lib/models/financial-year');
const Purpose = require('../../../../../src/lib/models/purpose');

exports.createLicence = (overrides = {}) => {
  const licence = new Licence();
  return licence.fromHash({
    licenceNumber: '01/134',
    startDate: overrides.startDate || '2000-01-01',
    expiryDate: overrides.endDate || null,
    revokedDate: overrides.revokedDate || null,
    lapsedDate: overrides.lapsedDate || null,
    licenceAgreements: []
  });
};

exports.createChargeVersion = (overrides = {}) => {
  const chargeVersion = new ChargeVersion();
  return chargeVersion.fromHash({
    dateRange: new DateRange(overrides.startDate || '2000-01-01', overrides.endDate || null),
    ...overrides
  });
};

exports.createChargeElement = (overrides = {}) => {
  const abstractionPeriod = new AbstractionPeriod();
  abstractionPeriod.fromHash({
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  });

  const purpose = new Purpose();
  purpose.fromHash({
    code: '400',
    description: 'Spray Irrigation Direct'
  });

  const chargeElement = new ChargeElement();

  if (overrides.timeLimitedStartDate && overrides.timeLimitedEndDate) {
    chargeElement.timeLimitedPeriod = new DateRange(overrides.timeLimitedStartDate, overrides.timeLimitedEndDate);
  }

  return chargeElement.fromHash({
    description: 'Test description',
    source: 'supported',
    season: 'summer',
    loss: 'medium',
    authorisedAnnualQuantity: 10.4,
    billableAnnualQuantity: 8.43,
    abstractionPeriod,
    purposeUse: purpose
  });
};

exports.createFinancialYear = () => new FinancialYear(2020);

exports.createBatch = (type) => {
  const batch = new Batch();
  return batch.fromHash({
    type
  });
};
