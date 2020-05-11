const uuid = require('uuid/v4');
const Agreement = require('../../../../../src/lib/models/agreement');
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period');
const Batch = require('../../../../../src/lib/models/batch');
const Company = require('../../../../../src/lib/models/company');
const ChargeElement = require('../../../../../src/lib/models/charge-element');
const ChargeVersion = require('../../../../../src/lib/models/charge-version');
const DateRange = require('../../../../../src/lib/models/date-range');
const InvoiceAccount = require('../../../../../src/lib/models/invoice-account');
const Licence = require('../../../../../src/lib/models/licence');
const LicenceAgreement = require('../../../../../src/lib/models/licence-agreement');
const FinancialYear = require('../../../../../src/lib/models/financial-year');
const Purpose = require('../../../../../src/lib/models/purpose');

const createLicence = (overrides = {}) => {
  const licence = new Licence();
  return licence.fromHash({
    licenceNumber: '01/134',
    startDate: overrides.startDate || '2000-01-01',
    expiryDate: overrides.expiryDate || null,
    revokedDate: overrides.revokedDate || null,
    lapsedDate: overrides.lapsedDate || null,
    licenceAgreements: [],
    isWaterUndertaker: overrides.isWaterUndertaker || false
  });
};

const createChargeVersion = (overrides = {}) => {
  const chargeVersion = new ChargeVersion(uuid());
  chargeVersion.company = new Company(uuid());
  chargeVersion.invoiceAccount = new InvoiceAccount(uuid());
  return chargeVersion.fromHash({
    dateRange: new DateRange(overrides.startDate || '2000-01-01', overrides.endDate || null),
    ...overrides
  });
};

const createChargeElement = (overrides = {}) => {
  const abstractionPeriod = new AbstractionPeriod();
  abstractionPeriod.fromHash(overrides.abstractionPeriod || {
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  });

  const purposeData = overrides.isSprayIrrigation
    ? { code: '400', name: 'Spray Irrigation Direct' }
    : { code: '300', name: 'Mineral washing' };

  const purpose = new Purpose();
  purpose.fromHash(purposeData);

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

const createFinancialYear = () => new FinancialYear(2020);

const createBatch = (type) => {
  const batch = new Batch();
  return batch.fromHash({
    type
  });
};

const createLicenceAgreement = (overrides = {}) => {
  // Create agreement
  const agreement = new Agreement();
  agreement.code = overrides.code || 'S127';
  // Create date range
  const dateRange = new DateRange(overrides.startDate || '2000-01-01', overrides.endDate || null);
  const licenceAgreement = new LicenceAgreement();
  return licenceAgreement.fromHash({
    dateRange,
    agreement
  });
};

const createChargeVersionWithTwoPartTariff = (overrides = {}) => {
  const cv = createChargeVersion();
  cv.licence = createLicence();
  cv.chargeElements = [
    createChargeElement(),
    createChargeElement({ isSprayIrrigation: true })
  ];
  cv.licence.licenceAgreements = [
    createLicenceAgreement()
  ];
  return cv;
};

exports.createLicence = createLicence;
exports.createChargeVersion = createChargeVersion;
exports.createChargeElement = createChargeElement;
exports.createFinancialYear = createFinancialYear;
exports.createBatch = createBatch;
exports.createLicenceAgreement = createLicenceAgreement;
exports.createChargeVersionWithTwoPartTariff = createChargeVersionWithTwoPartTariff;
