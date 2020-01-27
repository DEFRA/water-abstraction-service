const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const uuid = require('uuid/v4');
const invoiceAccountsService = require('../../../../src/modules/billing/services/invoice-accounts-service');
const Company = require('../../../../src/lib/models/company');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const invoiceAccountsConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts');

experiment('modules/billing/services/invoice-accounts-service', () => {
  let connectorResponse;
  beforeEach(async () => {
    connectorResponse = [
      {
        invoiceAccountId: uuid(),
        invoiceAccountNumber: 'A11111111A',
        startDate: '2019-08-12',
        endDate: null,
        dateCreated: '2019-11-25T15:55:38.015Z',
        dateUpdated: '2019-11-25T15:55:38.015Z',
        company: {
          companyId: uuid(),
          name: 'Test company 1',
          type: 'person',
          dateCreated: '2019-11-25T15:55:38.009Z',
          dateUpdated: '2019-11-25T15:55:38.009Z'
        }
      },
      {
        invoiceAccountId: uuid(),
        invoiceAccountNumber: 'A12121212A',
        startDate: '2019-08-12',
        endDate: null,
        dateCreated: '2019-11-25T15:55:38.019Z',
        dateUpdated: '2019-11-25T15:55:38.019Z',
        company: {
          companyId: uuid(),
          name: 'Test company 2',
          type: 'organisation',
          dateCreated: '2019-11-25T15:55:38.013Z',
          dateUpdated: '2019-11-25T15:55:38.013Z'
        }
      }
    ];
    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountsByIds').resolves(connectorResponse);
    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountById').resolves(connectorResponse[0]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getByInvoiceAccountIds', () => {
    test('passes the invoice account ids to the connector', async () => {
      const ids = [uuid()];
      await invoiceAccountsService.getByInvoiceAccountIds(ids);

      const [passedIds] = invoiceAccountsConnector.getInvoiceAccountsByIds.lastCall.args;

      expect(passedIds).to.equal(ids);
    });

    test('returns the data as InvoiceAccount objects', async () => {
      const response = await invoiceAccountsService.getByInvoiceAccountIds([uuid()]);

      expect(response[0]).to.be.an.instanceOf(InvoiceAccount);
      expect(response[0].id).to.equal(connectorResponse[0].invoiceAccountId);
      expect(response[0].accountNumber).to.equal(connectorResponse[0].invoiceAccountNumber);
      expect(response[0].company).to.be.an.instanceOf(Company);
      expect(response[0].company.id).to.equal(connectorResponse[0].company.companyId);
      expect(response[0].company.name).to.equal(connectorResponse[0].company.name);
      expect(response[0].company.type).to.equal(connectorResponse[0].company.type);

      expect(response[1]).to.be.an.instanceOf(InvoiceAccount);
      expect(response[1].id).to.equal(connectorResponse[1].invoiceAccountId);
      expect(response[1].accountNumber).to.equal(connectorResponse[1].invoiceAccountNumber);
      expect(response[1].company).to.be.an.instanceOf(Company);
      expect(response[1].company.id).to.equal(connectorResponse[1].company.companyId);
      expect(response[1].company.name).to.equal(connectorResponse[1].company.name);
      expect(response[1].company.type).to.equal(connectorResponse[1].company.type);
    });
  });

  experiment('.getByInvoiceAccountId', () => {
    test('passes the invoice account id to the connector', async () => {
      const id = uuid();
      await invoiceAccountsService.getByInvoiceAccountId(id);

      const [passedId] = invoiceAccountsConnector.getInvoiceAccountById.lastCall.args;
      expect(passedId).to.equal(id);
    });

    test('returns the data as an InvoiceAccount object', async () => {
      const response = await invoiceAccountsService.getByInvoiceAccountId(uuid());

      expect(response).to.be.an.instanceOf(InvoiceAccount);
      expect(response.id).to.equal(connectorResponse[0].invoiceAccountId);
      expect(response.accountNumber).to.equal(connectorResponse[0].invoiceAccountNumber);
      expect(response.company).to.be.an.instanceOf(Company);
      expect(response.company.id).to.equal(connectorResponse[0].company.companyId);
      expect(response.company.name).to.equal(connectorResponse[0].company.name);
      expect(response.company.type).to.equal(connectorResponse[0].company.type);
    });
  });
});
