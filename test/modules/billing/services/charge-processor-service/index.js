const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const { NotFoundError } = require('../../../../../src/lib/errors');

const Invoice = require('../../../../../src/lib/models/invoice');
const Transaction = require('../../../../../src/lib/models/transaction');

const crmV2 = require('../../../../../src/lib/connectors/crm-v2');
const chargeProcessorService = require('../../../../../src/modules/billing/services/charge-processor-service');
const chargeVersionService = require('../../../../../src/modules/billing/services/charge-version-service');
const transactionsProcessor = require('../../../../../src/modules/billing/services/charge-processor-service/transactions-processor');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const billingVolumeService = require('../../../../../src/modules/billing/services/billing-volumes-service');

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

experiment('modules/billing/services/charge-processor-service/index.js', async () => {
  beforeEach(async () => {
    sandbox.stub(crmV2.documents, 'getDocuments').resolves(crmData.documents);
    sandbox.stub(crmV2.documents, 'getDocument').resolves(crmData.document);
    sandbox.stub(crmV2.companies, 'getCompany').resolves(crmData.company);
    sandbox.stub(crmV2.invoiceAccounts, 'getInvoiceAccountById').resolves(crmData.invoiceAccount);

    sandbox.stub(chargeVersionService, 'getByChargeVersionId');
    sandbox.stub(batchService, 'getSentTPTBatchesForFinancialYearAndRegion');
    sandbox.stub(billingVolumeService, 'getVolumes');
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
    });

    experiment('when all charge version/CRM data is found', () => {
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionService.getByChargeVersionId.resolves(chargeVersion);

        // Run charge processor
        invoice = await chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);
      });

      test('the charge version is loaded with the correct ID', async () => {
        expect(chargeVersionService.getByChargeVersionId.calledWith(
          chargeVersion.id
        )).to.be.true();
      });

      test('the CRM company for the charge version is loaded', async () => {
        expect(crmV2.companies.getCompany.calledWith(
          chargeVersion.company.id
        )).to.be.true();
      });

      test('the sent TPT batches for the financial year are loaded', async () => {
        expect(batchService.getSentTPTBatchesForFinancialYearAndRegion.calledWith(
          financialYear, batch.region
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

      test('the Invoice returned has the correct licence-holder details', async () => {
        expect(invoice.invoiceLicences).to.be.an.array().length(1);
        const [invoiceLicence] = invoice.invoiceLicences;
        expect(invoiceLicence.company.id).to.equal(crmData.company.companyId);
        expect(invoiceLicence.address.id).to.equal(crmData.document.documentRoles[1].address.addressId);
        expect(invoiceLicence.address.addressLine1).to.equal(crmData.document.documentRoles[1].address.address1);
        expect(invoiceLicence.address.addressLine2).to.equal(crmData.document.documentRoles[1].address.address2);
        expect(invoiceLicence.address.addressLine3).to.equal(crmData.document.documentRoles[1].address.address3);
        expect(invoiceLicence.address.addressLine4).to.equal(crmData.document.documentRoles[1].address.address4);
        expect(invoiceLicence.address.town).to.equal(crmData.document.documentRoles[1].address.town);
        expect(invoiceLicence.address.county).to.equal(crmData.document.documentRoles[1].address.county);
        expect(invoiceLicence.address.postcode).to.equal(crmData.document.documentRoles[1].address.postcode);
        expect(invoiceLicence.address.country).to.equal(crmData.document.documentRoles[1].address.country);
      });

      test('the Invoice model returned has an array of transactions', async () => {
        expect(invoice.invoiceLicences[0].transactions).to.be.an.array().length(4);
        invoice.invoiceLicences[0].transactions.forEach(transaction => {
          expect(transaction instanceof Transaction).to.be.true();
        });
      });
    });

    experiment('if transactions have isTwoPartTariffSupplementary flag set to true', () => {
      let transaction, batch;
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionService.getByChargeVersionId.resolves(chargeVersion);
        transaction = data.createTransaction({ isTwoPartTariffSupplementary: true });
        transaction.chargeElement.id = '00000000-0000-0000-0000-000000000000';
        sandbox.stub(transactionsProcessor, 'createTransactions').returns([transaction]);
        batch = data.createBatch('two_part_tariff');
        invoice = await chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);
      });

      test('the billingVolumes service is called with correct params', async () => {
        const expectedChargeElement = [{
          ...chargeVersion.chargeElements[1].toJSON(),
          startDate: '2019-04-01',
          endDate: '2020-03-31',
          billableDays: 150,
          authorisedDays: 150,
          totalDays: 366
        }];
        const [chargeElement, licenceNumber, finYear, isSummer, batchArg] = billingVolumeService.getVolumes.lastCall.args;
        expect(chargeElement).to.equal(expectedChargeElement);
        expect(licenceNumber).to.equal(chargeVersion.licence.licenceNumber);
        expect(finYear).to.equal(financialYear.yearEnding);
        expect(isSummer).to.equal(true);
        expect(batchArg).to.equal(batch);
      });

      test('does not include the charge element without a matching transaction', async () => {
        const unrelatedElement = [
          chargeVersion.chargeElements[0].toJSON()
        ];
        const [chargeElement] = billingVolumeService.getVolumes.lastCall.args;
        expect(chargeElement).not.to.contain(unrelatedElement);
      });
    });

    experiment('if the charge version is not found', () => {
      beforeEach(async () => {
        chargeVersionService.getByChargeVersionId.resolves(null);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);

        const err = await expect(func()).to.reject();

        expect(err instanceof NotFoundError).to.be.true();
        expect(err.message).to.equal(`Charge version ${chargeVersion.id} not found`);
      });
    });

    experiment('if the CRM company is not found', () => {
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionService.getByChargeVersionId.resolves(chargeVersion);
        crmV2.companies.getCompany.resolves(null);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);

        const err = await expect(func()).to.reject();

        expect(err instanceof NotFoundError).to.be.true();
        expect(err.message).to.equal(`Company ${chargeVersion.company.id} not found in CRM`);
      });
    });

    experiment('if the CRM documents are not found', () => {
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionService.getByChargeVersionId.resolves(chargeVersion);
        crmV2.documents.getDocuments.resolves([]);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);

        const err = await expect(func()).to.reject();

        expect(err instanceof NotFoundError).to.be.true();
        expect(err.message).to.equal('Document not found in CRM for 01/134 on 2019-04-01');
      });
    });

    experiment('if the CRM document is not found', () => {
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionService.getByChargeVersionId.resolves(chargeVersion);
        crmV2.documents.getDocument.resolves(null);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);

        const err = await expect(func()).to.reject();

        expect(err instanceof NotFoundError).to.be.true();
        expect(err.message).to.equal('Document test-document-2 not found in CRM');
      });
    });

    experiment('if there is no relevant role in the CRM document data', () => {
      beforeEach(async () => {
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        chargeVersionService.getByChargeVersionId.resolves(chargeVersion);
        crmV2.documents.getDocument.resolves({
          documentRoles: []
        });
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => chargeProcessorService.processChargeVersionYear(batch, financialYear, chargeVersion.id);

        const err = await expect(func()).to.reject();

        expect(err instanceof NotFoundError).to.be.true();
        expect(err.message).to.equal('Licence holder role not found in CRM for document test-document-2 on 2019-04-01');
      });
    });
  });
});
