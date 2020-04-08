const Batch = require('../../../../src/lib/models/batch');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Transaction = require('../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const AbstractionPeriod = require('../../../../src/lib/models/abstraction-period');
const DateRange = require('../../../../src/lib/models/date-range');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const uuid = require('uuid/v4');

const abstractionPeriod = new AbstractionPeriod();
abstractionPeriod.fromHash({
  startDay: '1',
  startMonth: '4',
  endDay: '31',
  endMonth: '3'
});

const chargeElementId = uuid();
const chargeElement = new ChargeElement(chargeElementId);
chargeElement.fromHash({
  source: 'unsupported',
  season: 'summer',
  loss: 'medium',
  abstractionPeriod,
  authorisedAnnualQuantity: 20,
  billabledAnnualQuantity: null
});

const transaction = new Transaction('00112233-4455-6677-8899-aabbccddeeff');
transaction.fromHash({
  authorisedDays: 366,
  billableDays: 366,
  chargePeriod: new DateRange('2018-04-01', '2019-03-31'),
  chargeElement
});

const licenceId = uuid();
const licence = new Licence(licenceId);

const invoiceAccount = new InvoiceAccount();
invoiceAccount.fromHash({
  accountNumber: 'A12345678A'
});

const invoiceLicence = new InvoiceLicence();
invoiceLicence.fromHash({
  licence
});
invoiceLicence.transactions = [transaction];

const invoice = new Invoice();
invoice.fromHash({
  invoiceLicences: [invoiceLicence],
  invoiceAccount
});

const tptBatch = new Batch();
tptBatch.fromHash({
  type: Batch.BATCH_TYPE.twoPartTariff,
  season: 'summer',
  status: Batch.BATCH_STATUS.processing,
  startYear: new FinancialYear(2019),
  endYear: new FinancialYear(2019)
});

tptBatch.addInvoice(invoice);

exports.tptBatch = tptBatch;
exports.invoice = invoice;
exports.chargeElement = chargeElement;
exports.licence = licence;
exports.abstractionPeriod = abstractionPeriod;
exports.transaction = transaction;
