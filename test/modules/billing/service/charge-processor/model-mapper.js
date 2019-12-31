const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { Batch, Invoice, InvoiceAccount, Address, Company, Role } = require('../../../../../src/lib/models');
const Contact = require('../../../../../src/lib/models/contact-v2');
const modelMapper = require('../../../../../src/modules/billing/service/charge-processor/model-mapper');

const BATCH_ID = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';

const createCrmAddress = index =>
  Object.assign(new Address(), {
    addressId: `7d78cca3-4ed5-457d-a594-2b9687b7870${index}`,
    address1: `address1_${index}`,
    address2: `address2_${index}`,
    address3: `address3_${index}`,
    address4: `address4_${index}`,
    town: `town_${index}`,
    county: `county_${index}`,
    postcode: `postcode_${index}`,
    country: `country_${index}`
  });

const createCrmInvoiceAccount = index => ({
  invoiceAccountId: `20776517-ce06-4a3d-a898-7ffa921b802${index}`,
  invoiceAccountNumber: `S1234567${index}A`
});

const createChargeVersion = licenceRef => ({
  licenceRef
});

const createCrmContact = () =>
  Object.assign(new Contact(), {
    contactId: '8d72ac2f-a16e-4226-ab56-0065b5af058d',
    salutation: 'Captain',
    initials: 'J T',
    firstName: 'James',
    lastName: 'Kirk'
  });

const createCrmLicenceHolder = (options = {}) =>
  Object.assign(new Role(), {
    roleName: new Role().ROLE_LICENCE_HOLDER,
    startDate: '2000-09-30',
    endDate: null,
    company: Object.assign(new Company(), {
      companyId: 'a4d2ad99-4cda-4634-b1a2-a665aa125554',
      name: 'Big Farm Ltd'
    }),
    address: createCrmAddress(1),
    ...options
  });

const createData = () => [{
  chargeVersion: createChargeVersion('01/123'),
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(1),
    address: createCrmAddress(1)
  }
}, {
  chargeVersion: createChargeVersion('02/345'),
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(2),
    address: createCrmAddress(2)
  }
}, {
  chargeVersion: createChargeVersion('03/456'),
  invoiceAccount: {
    invoiceAccount: createCrmInvoiceAccount(1),
    address: createCrmAddress(1)
  }
}];

experiment('modules/billing/service/charge-processor/model-mapper.js', () => {
  experiment('modelMapper', () => {
    let data, roles, result, invoice;

    beforeEach(async () => {
      data = createData();
      roles = [createCrmLicenceHolder({ endDate: '2001-02-23', contact: createCrmContact() }), createCrmLicenceHolder({ startDate: '2001-02-24' })];

      result = modelMapper.modelMapper(BATCH_ID, data, roles);
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

      test('the first invoiceLicence has 2 licenceholder roles', async () => {
        expect(invoice.invoiceLicences[0].roles).to.have.length(2);
        expect(invoice.invoiceLicences[0].roles[0].roleName).to.equal(new Role().ROLE_LICENCE_HOLDER);
        expect(invoice.invoiceLicences[0].roles[1].roleName).to.equal(new Role().ROLE_LICENCE_HOLDER);
      });

      experiment('the first role', async () => {
        let role;
        beforeEach(async () => {
          role = result.invoices[0].invoiceLicences[0].roles[0];
        });

        test('has a company', async () => {
          expect(role.company instanceof Company).to.be.true();
        });

        test('has a contact', async () => {
          expect(role.contact instanceof Contact).to.be.true();
          expect(role.contact.fullName).to.equal('Captain J T Kirk');
        });

        test('has an address', async () => {
          expect(role.address instanceof Address).to.be.true();
        });
      });

      experiment('the second role', async () => {
        let role;
        beforeEach(async () => {
          role = result.invoices[0].invoiceLicences[0].roles[1];
        });

        test('has a company', async () => {
          expect(role.company instanceof Company).to.be.true();
        });

        test('does not have a contact', async () => {
          expect(role.contact).to.be.undefined();
        });

        test('has an address', async () => {
          expect(role.address instanceof Address).to.be.true();
        });
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

      test('the first invoiceLicence does not have a contact', async () => {
        const { contact } = invoice.invoiceLicences[0];
        expect(contact).to.be.undefined();
      });

      test('the first invoiceLicence has 2 licenceholder roles', async () => {
        expect(invoice.invoiceLicences[0].roles).to.have.length(2);
        expect(invoice.invoiceLicences[0].roles[0].roleName).to.equal(new Role().ROLE_LICENCE_HOLDER);
        expect(invoice.invoiceLicences[0].roles[1].roleName).to.equal(new Role().ROLE_LICENCE_HOLDER);
      });

      experiment('the first role', async () => {
        let role;
        beforeEach(async () => {
          role = result.invoices[0].invoiceLicences[0].roles[0];
        });

        test('has a company', async () => {
          expect(role.company instanceof Company).to.be.true();
        });

        test('has a contact', async () => {
          expect(role.contact instanceof Contact).to.be.true();
          expect(role.contact.fullName).to.equal('Captain J T Kirk');
        });

        test('has an address', async () => {
          expect(role.address instanceof Address).to.be.true();
        });
      });

      experiment('the second role', async () => {
        let role;
        beforeEach(async () => {
          role = result.invoices[0].invoiceLicences[0].roles[1];
        });

        test('has a company', async () => {
          expect(role.company instanceof Company).to.be.true();
        });

        test('does not have a contact', async () => {
          expect(role.contact).to.be.undefined();
        });

        test('has an address', async () => {
          expect(role.address instanceof Address).to.be.true();
        });
      });
    });
  });
});
