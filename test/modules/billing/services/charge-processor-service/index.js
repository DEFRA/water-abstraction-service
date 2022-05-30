const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const Invoice = require('../../../../../src/lib/models/invoice');
const Transaction = require('../../../../../src/lib/models/transaction');

const crmV2 = require('../../../../../src/lib/connectors/crm-v2');
const chargeProcessorService = require('../../../../../src/modules/billing/services/charge-processor-service');
const chargeVersionService = require('../../../../../src/lib/services/charge-versions');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const billingVolumeService = require('../../../../../src/modules/billing/services/billing-volumes-service');

const invoiceAccountsConnector = require('../../../../../src/lib/connectors/crm-v2/invoice-accounts');

const data = require('./data');

const companyId = uuid();
const invoiceAccountId = uuid();

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
          addressId: uuid()
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
          country: 'UK',
          dataSource: 'nald'
        }
      }
    ]
  },
  invoiceAccount: {
    invoiceAccountId,
    invoiceAccountNumber: 'A12345678A',
    invoiceAccountAddresses: [{
      invoiceAccountId,
      startDate: '2016-01-01',
      endDate: '2018-01-01',
      address: {
        addressId: uuid(),
        address1: 'The old office',
        address2: 'Officey place',
        address3: 'Central square',
        address4: null,
        town: 'Testington',
        county: 'Testingshire',
        postcode: 'TT1 1TT',
        country: 'UK',
        dataSource: 'nald'

      },
      agentCompany: null,
      contact: null
    }, {
      invoiceAccountId,
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
        country: 'UK',
        dataSource: 'nald'

      },
      agentCompany: null,
      contact: null
    }],
    company: {
      companyId,
      name: 'company name',
      type: 'organisation',
      organisationType: null
    }
  },
  company: {
    companyId,
    name: 'company name',
    type: 'organisation',
    organisationType: null
  }
};

experiment('modules/billing/services/charge-processor-service/index.js', () => {
  beforeEach(async () => {
    sandbox.stub(crmV2.documents, 'getDocuments').resolves(crmData.documents);
    sandbox.stub(crmV2.documents, 'getDocument').resolves(crmData.document);
    sandbox.stub(crmV2.companies, 'getCompany').resolves(crmData.company);
    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountById').resolves(crmData.invoiceAccount);
    sandbox.stub(chargeVersionService, 'getByChargeVersionId');
    sandbox.stub(batchService, 'getSentTptBatchesForFinancialYearAndRegion');
    sandbox.stub(billingVolumeService, 'getVolumesForChargeElements').resolves([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.processChargeVersionYear', () => {
    let invoice, batch, financialYear, chargeVersion, chargeVersionYear;

    beforeEach(async () => {
      // Create batch and charge version data
      batch = data.createBatch('supplementary', { scheme: 'alcs' });
      financialYear = data.createFinancialYear();
    });

    experiment('when all charge version/CRM data is found', () => {
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionYear = data.createChargeVersionYear(batch, chargeVersion, financialYear);
        const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
        billingVolumeService.getVolumesForChargeElements.resolves(billingVolumes);

        // Run charge processor
        invoice = await chargeProcessorService.processChargeVersionYear(chargeVersionYear);
      });

      experiment('when creating annual transactions', () => {
        test('the invoice account for the charge version is loaded', async () => {
          expect(invoiceAccountsConnector.getInvoiceAccountById.calledWith(
            chargeVersion.invoiceAccount.id
          )).to.be.true();
        });

        test('the billing volumes are not fetched', async () => {
          expect(billingVolumeService.getVolumesForChargeElements.called).to.be.false();
        });

        test('an Invoice model is returned', async () => {
          expect(invoice instanceof Invoice).to.be.true();
        });

        test('the Invoice returned has correct invoice account details from CRM', async () => {
          const { invoiceAccount } = invoice;
          expect(invoiceAccount.id).to.equal(crmData.invoiceAccount.invoiceAccountId);
          expect(invoiceAccount.accountNumber).to.equal(crmData.invoiceAccount.invoiceAccountNumber);
        });

        test('the Invoice has the most recent address on the invoice account', async () => {
          const { address } = invoice;
          const { address: crmAddress } = crmData.invoiceAccount.invoiceAccountAddresses[1];
          expect(address.id).to.equal(crmAddress.addressId);
          expect(address.addressLine1).to.equal(crmAddress.address1);
          expect(address.addressLine2).to.equal(crmAddress.address2);
          expect(address.addressLine3).to.equal(crmAddress.address3);
          expect(address.addressLine4).to.equal(crmAddress.address4);
          expect(address.town).to.equal(crmAddress.town);
          expect(address.county).to.equal(crmAddress.county);
          expect(address.postcode).to.equal(crmAddress.postcode);
          expect(address.country).to.equal(crmAddress.country);
        });

        test('the Invoice model returned has an array of transactions', async () => {
          expect(invoice.invoiceLicences[0].transactions).to.be.an.array().length(4);
          invoice.invoiceLicences[0].transactions.forEach(transaction => {
            expect(transaction instanceof Transaction).to.be.true();
          });
        });
      });

      experiment('when creating two part tariff transactions', () => {
        test('the billing volumes are fetched', async () => {
          chargeVersionYear = data.createChargeVersionYear(batch, chargeVersion, financialYear, { transactionType: 'two_part_tariff' });
          await chargeProcessorService.processChargeVersionYear(chargeVersionYear);
          expect(billingVolumeService.getVolumesForChargeElements.calledWith(
            chargeVersion.chargeElements, financialYear
          )).to.be.true();
        });
      });
    });
  });
});
