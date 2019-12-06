const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { Batch, Invoice, InvoiceAccount, Address, Company } = require('../../../../../src/lib/models');
const Contact = require('../../../../../src/lib/models/contact-v2');
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

const createChargeVersion = licenceRef => ({
  licenceRef
});

const createCrmContact = () => ({
  contactId: '8d72ac2f-a16e-4226-ab56-0065b5af058d',
  salutation: 'Captain',
  initials: 'J T',
  firstName: 'James',
  lastName: 'Kirk'
});

const createCrmLicenceHolder = withContact => ({
  company: {
    companyId: 'a4d2ad99-4cda-4634-b1a2-a665aa125554',
    name: 'Big Farm Ltd'
  },
  contact: withContact ? createCrmContact() : null,
  address: createCrmAddress(1)
});

const createData = () => [{
  chargeVersion: createChargeVersion('01/123'),
  licenceHolder: createCrmLicenceHolder(),
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(1),
    address: createCrmAddress(1)
  }
}, {
  chargeVersion: createChargeVersion('02/345'),
  licenceHolder: createCrmLicenceHolder(true),
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(2),
    address: createCrmAddress(2)
  }
}, {
  chargeVersion: createChargeVersion('03/456'),
  licenceHolder: createCrmLicenceHolder(),
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(1),
    address: createCrmAddress(1)
  }
}];

experiment('modules/billing/service/charge-processor/model-mapper.js', () => {
  experiment('modelMapper', () => {
    let data, result, invoice;

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

    experiment('the first invoice', () => {
      beforeEach(async () => {
        invoice = result.invoices[0];
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has an InvoiceAccount instance', async () => {
        expect(invoice.invoiceAccount instanceof InvoiceAccount).to.be.true();
      });

      test('has the correct account number', async () => {
        expect(invoice.invoiceAccount.accountNumber).to.equal('S12345671A');
      });

      test('has the correct address', async () => {
        expect(invoice.address instanceof Address).to.be.true();
        expect(invoice.address.id).to.equal(data[0].invoiceAccount.address.addressId);
      });

      test('has an invoiceLicence for each licence', async () => {
        expect(invoice.invoiceLicences).to.have.length(2);
        expect(invoice.invoiceLicences[0].licence.licenceNumber).to.equal('01/123');
        expect(invoice.invoiceLicences[1].licence.licenceNumber).to.equal('03/456');
      });

      test('the first invoiceLicence has an address', async () => {
        expect(invoice.invoiceLicences[0].address instanceof Address).to.be.true();
      });

      test('the first invoiceLicence has a company', async () => {
        expect(invoice.invoiceLicences[0].company instanceof Company).to.be.true();
      });

      test('the first invoiceLicence has no contact', async () => {
        expect(invoice.invoiceLicences[0].contact).to.be.undefined();
      });

      test('the second invoiceLicence has an address', async () => {
        expect(invoice.invoiceLicences[1].address instanceof Address).to.be.true();
      });

      test('the second invoiceLicence has a company', async () => {
        expect(invoice.invoiceLicences[1].company instanceof Company).to.be.true();
      });

      test('the second invoiceLicence has no contact', async () => {
        expect(invoice.invoiceLicences[1].contact).to.be.undefined();
      });
    });

    experiment('the second invoice', () => {
      beforeEach(async () => {
        invoice = result.invoices[1];
      });

      test('is an instance of Invoice', async () => {
        expect(invoice instanceof Invoice).to.be.true();
      });

      test('has an InvoiceAccount instance', async () => {
        expect(invoice.invoiceAccount instanceof InvoiceAccount).to.be.true();
      });

      test('has the correct account number', async () => {
        expect(invoice.invoiceAccount.accountNumber).to.equal('S12345672A');
      });

      test('has the correct address', async () => {
        expect(invoice.address instanceof Address).to.be.true();
        expect(invoice.address.id).to.equal(data[1].invoiceAccount.address.addressId);
      });

      test('has an invoiceLicence for each licence', async () => {
        expect(invoice.invoiceLicences).to.have.length(1);
        expect(invoice.invoiceLicences[0].licence.licenceNumber).to.equal('02/345');
      });

      test('the first invoiceLicence has an address', async () => {
        expect(invoice.invoiceLicences[0].address instanceof Address).to.be.true();
      });

      test('the first invoiceLicence has a company', async () => {
        expect(invoice.invoiceLicences[0].company instanceof Company).to.be.true();
      });

      test('the first invoiceLicence has a contact', async () => {
        const { contact } = invoice.invoiceLicences[0];
        expect(contact instanceof Contact).to.be.true();
        expect(contact.fullName).to.equal('Captain J T Kirk');
      });
    });
  });
});
