'use strict';

const uuid = require('uuid/v4');

// Service models
const Batch = require('../../../../../src/lib/models/batch');
const Invoice = require('../../../../../src/lib/models/invoice');
const InvoiceLicence = require('../../../../../src/lib/models/invoice-licence');
const Transaction = require('../../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../../src/lib/models/charge-element');
const Licence = require('../../../../../src/lib/models/licence');
const DateRange = require('../../../../../src/lib/models/date-range');
const InvoiceAccount = require('../../../../../src/lib/models/invoice-account');
const Region = require('../../../../../src/lib/models/region');

const createRegion = () => {
  const region = new Region(uuid());
  return region.fromHash({
    code: 'T',
    name: 'Test region'
  });
};

const createBatch = (batchId, transactionId, status = 'candidate') => {
  const batch = new Batch(batchId);
  const invoiceAccount = new InvoiceAccount(uuid());
  invoiceAccount.fromHash({
    accountNumber: 'A12345678A'
  });
  const invoice = new Invoice(uuid());
  invoice.fromHash({
    invoiceAccount
  });
  batch.invoices = [
    invoice
  ];
  const invoiceLicence = new InvoiceLicence(uuid());
  invoice.invoiceLicences = [
    invoiceLicence
  ];
  const chargeElement = new ChargeElement(uuid());
  chargeElement.fromHash({
    source: 'supported',
    season: 'summer',
    loss: 'high'
  });
  const transaction = new Transaction(transactionId);
  transaction.fromHash({
    status,
    chargeElement,
    chargePeriod: new DateRange('2019-04-01', '2020-03-31')
  });
  invoiceLicence.transactions = [
    transaction
  ];
  const licence = new Licence(uuid());
  licence.fromHash({
    licenceNumber: '01/234/ABC',
    region: createRegion(),
    regionalChargeArea: createRegion(),
    historicalArea: createRegion()
  });
  invoiceLicence.licence = licence;

  return batch;
};

exports.createBatch = createBatch;
