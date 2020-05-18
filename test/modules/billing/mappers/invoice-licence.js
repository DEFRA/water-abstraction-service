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
const Transaction = require('../../../../src/lib/models/transaction');

const createLicence = () => ({
  licenceId: 'd563b2b9-e87e-4a9c-8990-1acc96fe2c17',
  licenceRef: '01/123',
  region: {
    regionId: '80bb8d61-786c-4b86-9bb4-8959fa6a2d20',
    name: 'Anglian',
    displayName: 'Anglian',
    chargeRegionId: 'A'
  },
  regions: { historicalAreaCode: 'ARCA', regionalChargeArea: 'Anglian' },
  startDate: '2020-01-01',
  expiredDate: null,
  lapsedDate: null,
  revokedDate: null
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
        licence: createLicence(),
        billingInvoiceId: 'cf796261-fc3a-4203-86fd-a4b39e9f3f88'
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

      test('the invoiceId is set', async () => {
        expect(result.invoiceId).to.equal(dbRow.billingInvoiceId);
      });
    });

    experiment('when the contact ID is set', () => {
      const dbRow = {
        billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
        companyId: '40283a80-766f-481f-ba54-484ac0b7ea6d',
        addressId: '399282c3-f9b4-4a4b-af1b-0019e040ad61',
        contactId: 'b21a7769-942e-4166-a787-a16701f25e4e',
        licence: createLicence(),
        billingInvoiceId: 'cf796261-fc3a-4203-86fd-a4b39e9f3f88'
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
          }],
          billingInvoiceId: 'cf796261-fc3a-4203-86fd-a4b39e9f3f88'
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
});
