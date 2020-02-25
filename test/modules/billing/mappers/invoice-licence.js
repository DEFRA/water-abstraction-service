'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const invoiceLicenceMapper = require('../../../../src/modules/billing/mappers/invoice-licence');
const transactionMapper = require('../../../../src/modules/billing/mappers/transaction');

const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Address = require('../../../../src/lib/models/address');
const Company = require('../../../../src/lib/models/company');
const Contact = require('../../../../src/lib/models/contact-v2');
const Licence = require('../../../../src/lib/models/licence');
const Region = require('../../../../src/lib/models/region');
const Transaction = require('../../../../src/lib/models/transaction');

const createLicence = () => ({
  licenceId: 'd563b2b9-e87e-4a9c-8990-1acc96fe2c17',
  licenceRef: '01/123',
  region: {
    regionId: '80bb8d61-786c-4b86-9bb4-8959fa6a2d20',
    name: 'Anglian',
    chargeRegionId: 'A'
  },
  regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' }
});

experiment('modules/billing/mappers/invoice-licence', () => {
  beforeEach(async () => {
    sandbox.stub(transactionMapper, 'dbToModel').returns(new Transaction());
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.dbToModel', () => {
    let result;
    experiment('when there is no contact ID', () => {
      const dbRow = {
        billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
        companyId: '40283a80-766f-481f-ba54-484ac0b7ea6d',
        addressId: '399282c3-f9b4-4a4b-af1b-0019e040ad61',
        licence: createLicence()
      };

      beforeEach(async () => {
        result = invoiceLicenceMapper.dbToModel(dbRow);
      });

      test('returns an instance of InvoiceLicence with correct ID', async () => {
        expect(result instanceof InvoiceLicence).to.be.true();
        expect(result.id).to.equal(dbRow.billingInvoiceLicenceId);
      });

      test('the invoiceLicence has a company with correct ID', async () => {
        expect(result.company instanceof Company).to.be.true();
        expect(result.company.id).to.equal(dbRow.companyId);
      });

      test('the invoiceLicence has an address with correct ID', async () => {
        expect(result.address instanceof Address).to.be.true();
        expect(result.address.id).to.equal(dbRow.addressId);
      });

      test('the contact is not set', async () => {
        expect(result.contact).to.be.undefined();
      });

      test('the invoiceLicence has a Licence', async () => {
        expect(result.licence instanceof Licence).to.be.true();
      });
    });

    experiment('when there contact ID is set', () => {
      const dbRow = {
        billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
        companyId: '40283a80-766f-481f-ba54-484ac0b7ea6d',
        addressId: '399282c3-f9b4-4a4b-af1b-0019e040ad61',
        contactId: 'b21a7769-942e-4166-a787-a16701f25e4e',
        licence: createLicence()
      };

      beforeEach(async () => {
        result = invoiceLicenceMapper.dbToModel(dbRow);
      });

      test('the invoiceLicence has a contact with correct ID', async () => {
        expect(result.contact instanceof Contact).to.be.true();
        expect(result.contact.id).to.equal(dbRow.contactId);
      });
    });

    experiment('when there are billingTransactions', async () => {
      let dbRow;

      beforeEach(async () => {
        dbRow = {
          billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
          companyId: '40283a80-766f-481f-ba54-484ac0b7ea6d',
          addressId: '399282c3-f9b4-4a4b-af1b-0019e040ad61',
          contactId: 'b21a7769-942e-4166-a787-a16701f25e4e',
          licence: createLicence(),
          billingTransactions: [{
            billingTransactionId: uuid()
          }, {
            billingTransactionId: uuid()
          }]
        };
        result = invoiceLicenceMapper.dbToModel(dbRow);
      });

      test('the transaction mapper .dbToModel is called for each billingTransaction', async () => {
        expect(transactionMapper.dbToModel.callCount).to.equal(2);
        expect(transactionMapper.dbToModel.calledWith(dbRow.billingTransactions[0])).to.be.true();
        expect(transactionMapper.dbToModel.calledWith(dbRow.billingTransactions[1])).to.be.true();
      });

      test('the transactions property contains an array of Transaction instances', async () => {
        expect(result.transactions).to.be.an.array().length(2);
        expect(result.transactions[0] instanceof Transaction).to.be.true();
        expect(result.transactions[1] instanceof Transaction).to.be.true();
      });
    });
  });

  experiment('.chargeToModel', () => {
    let mappedInvoiceLicence;
    let batch;
    let data;

    beforeEach(async () => {
      data = {
        chargeElements: [],
        chargeVersion: {
          licenceId: uuid(),
          licenceRef: '123/321'
        },
        licenceHolder: {
          company: {
            companyId: uuid(),
            name: 'Wheat Co'
          },
          address: {
            addressId: uuid(),
            address1: 'Add One',
            address2: 'Add Two',
            address3: null,
            address4: null,
            town: 'Add Town',
            county: 'Add County',
            postcode: 'AD1 1AD',
            country: null
          },
          contact: {
            salutation: 'Ms',
            lastName: 'Teek'
          }
        }
      };
      batch = {
        region: new Region().fromHash({ code: 'A ' })
      };
      mappedInvoiceLicence = invoiceLicenceMapper.chargeToModel(data, batch);
    });

    test('maps the licence', async () => {
      const { licence } = mappedInvoiceLicence;
      expect(licence.id).to.equal(data.chargeVersion.licenceId);
      expect(licence.licenceNumber).to.equal(data.chargeVersion.licenceRef);
      expect(licence.region.code).to.equal(batch.region.code);
    });

    test('maps the company', async () => {
      const { company } = mappedInvoiceLicence;
      expect(company.id).to.equal(data.licenceHolder.company.companyId);
      expect(company.name).to.equal(data.licenceHolder.company.name);
    });

    test('maps the address', async () => {
      const { address } = mappedInvoiceLicence;
      expect(address.id).to.equal(data.licenceHolder.address.addressId);
      expect(address.addressLine1).to.equal(data.licenceHolder.address.address1);
      expect(address.addressLine2).to.equal(data.licenceHolder.address.address2);
      expect(address.addressLine3).to.equal(data.licenceHolder.address.address3);
      expect(address.addressLine4).to.equal(data.licenceHolder.address.address4);
      expect(address.town).to.equal(data.licenceHolder.address.town);
      expect(address.county).to.equal(data.licenceHolder.address.county);
      expect(address.postcode).to.equal(data.licenceHolder.address.postcode);
      expect(address.country).to.equal(data.licenceHolder.address.country);
    });

    test('maps the contact', async () => {
      const { contact } = mappedInvoiceLicence;
      expect(contact.salutation).to.equal(data.licenceHolder.contact.salutation);
      expect(contact.lastName).to.equal(data.licenceHolder.contact.lastName);
    });
  });
});
