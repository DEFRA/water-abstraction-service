const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { Batch, Invoice, InvoiceAccount, Address } = require('../../../../../src/lib/models');
const modelMapper = require('../../../../../src/modules/billing/service/charge-processor/model-mapper');

const BATCH_ID = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';

const createCrmAddress = index => ({
  addressId: `7d78cca3-4ed5-457d-a594-2b9687b7870${index}`,
  address1: `address1_${index}`,
  address2: `address2_${index}`,
  address3: `address3_${index}`,
  address4: `address4_${index}`,
  town: `town_${index}`,
  county: `county_${index}`,
  postcode: `country_${index}`,
  country: `country_${index}`
});

const createCrmInvoiceAccount = index => ({
  invoiceAccountId: `20776517-ce06-4a3d-a898-7ffa921b802${index}`,
  invoiceAccountNumber: `S1234567${index}A`
});

const createData = () => [{
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(1),
    address: createCrmAddress(1)
  }
}, {
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(2),
    address: createCrmAddress(2)
  }
}, {
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(1),
    address: createCrmAddress(1)
  }
}];

experiment('modules/billing/service/charge-processor/model-mapper.js', () => {
  experiment('modelMapper', () => {
    let data, result;

    beforeEach(async () => {
      data = createData();
      result = modelMapper.modelMapper(BATCH_ID, data);
    });

    test('should return a batch with the correct ID', async () => {
      expect(result instanceof Batch).to.be.true();
      expect(result.id).to.equal(BATCH_ID);
    });

    test('should have 2 invoices (invoice account IDs must be unique in batch)', async () => {
      expect(result.invoices).to.be.an.array().length(2);
    });

    test('the first invoice is an instance of Invoice', async () => {
      expect(result.invoices[0] instanceof Invoice).to.be.true();
    });

    test('the first invoice has an InvoiceAccount instance', async () => {
      expect(result.invoices[0].invoiceAccount instanceof InvoiceAccount).to.be.true();
    });

    test('the first invoice has the correct account number', async () => {
      expect(result.invoices[0].invoiceAccount.accountNumber).to.equal('S12345671A');
    });

    test('the first invoice has the correct address', async () => {
      expect(result.invoices[0].address instanceof Address).to.be.true();
      expect(result.invoices[0].address.id).to.equal(data[0].invoiceAccount.address.addressId);
    });

    test('the second invoice is an instance of Invoice', async () => {
      expect(result.invoices[1] instanceof Invoice).to.be.true();
    });

    test('the second invoice has an InvoiceAccount instance', async () => {
      expect(result.invoices[1].invoiceAccount instanceof InvoiceAccount).to.be.true();
    });

    test('the second invoice has the correct account number', async () => {
      expect(result.invoices[1].invoiceAccount.accountNumber).to.equal('S12345672A');
    });

    test('the second invoice has the correct address', async () => {
      expect(result.invoices[1].address instanceof Address).to.be.true();
      expect(result.invoices[1].address.id).to.equal(data[1].invoiceAccount.address.addressId);
    });
  });
});
