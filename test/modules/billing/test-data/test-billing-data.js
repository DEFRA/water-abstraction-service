const Batch = require('../../../../src/lib/models/batch');
const Region = require('../../../../src/lib/models/region');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Transaction = require('../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period');
const DateRange = require('../../../../src/lib/models/date-range');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const User = require('../../../../src/lib/models/user');
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants');

const createFinancialYear = year => new FinancialYear(year);

const createUser = options => {
  const { id, email } = options;
  const user = new User();
  return user.fromHash({ id, email });
};

const createChargeElement = () => {
  const chargeElement = new ChargeElement('29328315-9b24-473b-bde7-02c60e881501');
  chargeElement.fromHash({
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'low',
    authorisedAnnualQuantity: 12.5,
    billableAnnualQuantity: null
  });
  chargeElement.abstractionPeriod = new AbstractionPeriod();
  chargeElement.abstractionPeriod.fromHash({
    startDay: 1,
    startMonth: 1,
    endDay: 31,
    endMonth: 12
  });
  return chargeElement;
};

const createTransaction = (options = {}, chargeElement) => {
  const transaction = new Transaction(options.id || '');
  transaction.fromHash({
    chargeElement: chargeElement || createChargeElement(),
    chargePeriod: new DateRange('2019-04-01', '2020-03-31'),
    isCredit: false,
    isCompensationCharge: !!options.isCompensationCharge,
    authorisedDays: 366,
    billableDays: 366,
    description: 'Tiny pond',
    volume: 5.64,
    twoPartTariffError: !!options.twoPartTariffError
  });

  if (options.twoPartTariffReview) {
    transaction.twoPartTariffReview = createUser(options.twoPartTariffReview);
  }
  return transaction;
};

const createLicence = () => {
  const licence = new Licence();
  licence.fromHash({
    id: '4838e713-9499-4b9d-a7c0-c4c9a008a589',
    licenceNumber: '01/123/ABC',
    isWaterUndertaker: true
  });
  licence.region = new Region();
  licence.region.fromHash({
    type: Region.types.region,
    name: 'Anglian',
    code: 'A',
    numericCode: 3
  });
  licence.regionalChargeArea = new Region();
  licence.regionalChargeArea.fromHash({
    type: Region.types.regionalChargeArea,
    name: 'Anglian'
  });
  licence.historicalArea = new Region();
  licence.historicalArea.fromHash({
    type: Region.types.environmentAgencyArea,
    code: 'ARCA'
  });
  return licence;
};

const createInvoiceLicence = (options = {}, licence) => {
  const invoiceLicence = new InvoiceLicence('c4fd4bf6-9565-4ff8-bdba-e49355446d7b');
  invoiceLicence.fromHash(options);
  invoiceLicence.licence = licence || createLicence();
  return invoiceLicence;
};

const createInvoice = (options = {}, invoiceLicences) => {
  const invoice = new Invoice();
  const invoiceAccount = new InvoiceAccount();
  invoiceAccount.fromHash({
    accountNumber: 'A12345678A'
  });
  return invoice.fromHash({
    invoiceLicences: invoiceLicences || [createInvoiceLicence()],
    invoiceAccount,
    options
  });
};

const createBatch = (options = {}, invoice) => {
  const batch = new Batch();
  batch.fromHash(options);
  return batch.addInvoice(invoice || createInvoice());
};

exports.createInvoiceLicence = createInvoiceLicence;
exports.createInvoice = createInvoice;
exports.createTransaction = createTransaction;
exports.createBatch = createBatch;
exports.createUser = createUser;
exports.createLicence = createLicence;
exports.createChargeElement = createChargeElement;
exports.createFinancialYear = createFinancialYear;
