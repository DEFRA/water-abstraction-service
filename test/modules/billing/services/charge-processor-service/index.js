const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const Invoice = require('../../../../../src/lib/models/invoice');

const crmV2 = require('../../../../../src/lib/connectors/crm-v2');
const chargeProcessorService = require('../../../../../src/modules/billing/services/charge-processor-service');
const chargeVersionService = require('../../../../../src/modules/billing/services/charge-version-service');

const data = require('./data');

const crmData = {
  documents: [{
    documentId: 'test-document-1',
    startDate: '2018-01-01',
    endDate: '2018-12-31'
  }, {
    documentId: 'test-document-2',
    startDate: '2019-01-01',
    endDate: null
  }],
  document: {
    documentRoles: [
      {
        roleName: 'licenceHolder',
        startDate: '2019-01-01',
        endDate: '2019-03-31',
        contact: null,
        address: {

        }
      },
      {
        roleName: 'licenceHolder',
        startDate: '2019-04-01',
        endDate: null,
        contact: null,
        address: {
          addressId: uuid(),
          address1: 'Daisy farm',
          address2: 'Little meadow',
          address3: 'Oak tree lane',
          address4: null,
          town: 'Testington',
          county: 'Testingshire',
          postcode: 'TT1 1TT',
          country: 'UK'
        }
      }
    ]
  },
  invoiceAccount: {
    invoiceAccountId: uuid(),
    invoiceAccountNumber: 'A12345678A',
    invoiceAccountAddresses: [{
      startDate: '2016-01-01',
      endDate: '2018-01-01',
      address: {

      }
    }, {
      startDate: '2019-01-01',
      endDate: null,
      address: {
        addressId: uuid(),
        address1: 'Shiny new office',
        address2: 'Officey place',
        address3: 'Central square',
        address4: null,
        town: 'Testington',
        county: 'Testingshire',
        postcode: 'TT1 1TT',
        country: 'UK'
      }
    }]
  },
  company: {
    companyId: uuid()
  }
};

experiment('modules/billing/services/charge-processor-service/index.js', async () => {
  beforeEach(async () => {
    sandbox.stub(crmV2.documents, 'getDocuments').resolves(crmData.documents);
    sandbox.stub(crmV2.documents, 'getDocument').resolves(crmData.document);
    sandbox.stub(crmV2.companies, 'getCompany').resolves(crmData.company);
    sandbox.stub(crmV2.invoiceAccounts, 'getInvoiceAccountById').resolves(crmData.invoiceAccount);

    sandbox.stub(chargeVersionService, 'getByChargeVersionId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.processChargeVersionYear', () => {
    let invoice, batch, financialYear, chargeVersion;

    beforeEach(async () => {
      // Create batch and charge version data
      batch = data.createBatch('annual');
      financialYear = data.createFinancialYear();
      chargeVersion = data.createChargeVersionWithTwoPartTariff();
      chargeVersionService.getByChargeVersionId.resolves(chargeVersion);

      // Run charge processor
      invoice = await chargeProcessorService.processChargeVersionYear(batch, financialYear, 'charge-version-id');
    });

    test('the charge version is loaded with the correct ID', async () => {
      expect(chargeVersionService.getByChargeVersionId.calledWith(
        'charge-version-id'
      )).to.be.true();
    });

    test('the CRM company for the charge version is loaded', async () => {
      expect(crmV2.companies.getCompany.calledWith(
        chargeVersion.company.id
      )).to.be.true();
    });

    test('the invoice account for the charge version is loaded', async () => {
      expect(crmV2.invoiceAccounts.getInvoiceAccountById.calledWith(
        chargeVersion.invoiceAccount.id
      )).to.be.true();
    });

    test('CRM documents are loaded for the charge version licence number', async () => {
      expect(crmV2.documents.getDocuments.calledWith(
        chargeVersion.licence.licenceNumber
      )).to.be.true();
    });

    test('the document relating to the start of the charge period is loaded', async () => {
      expect(crmV2.documents.getDocument.calledWith(
        crmData.documents[1].documentId
      )).to.be.true();
    });

    test('an Invoice model is returned', async () => {
      expect(invoice instanceof Invoice).to.be.true();
    });

    test('the Invoice returned has correct invoice account details from CRM', async () => {
      const { invoiceAccount } = invoice;
      expect(invoiceAccount.id).to.equal(crmData.invoiceAccount.invoiceAccountId);
      expect(invoiceAccount.accountNumber).to.equal(crmData.invoiceAccount.invoiceAccountNumber);
    });
  });
});
