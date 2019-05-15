const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const returnsConnector = require('../../../src/lib/connectors/returns');
const documentsConnector = require('../../../src/lib/connectors/crm/documents');

const controller = require('../../../src/modules/companies/controller');

const documents = [{
  system_external_id: 'licence_1'
}, {
  system_external_id: 'licence_2'
}];
const returns = [{
  return_id: 'return_1',
  licence_ref: 'licence_1',
  start_date: '2018-04-01',
  end_date: '2019-03-31',
  return_requirement: 'requirement_1',
  returns_frequency: 'day',
  status: 'due'
}];
const request = {
  params: {
    entityId: 'company_1'
  },
  query: {
    startDate: '2018-04-01',
    endDate: '2019-03-31',
    isSummer: false,
    status: 'due'
  }
};

experiment('companies API', () => {
  afterEach(async () => {
    sandbox.restore();
  });
  experiment('getReturns', () => {
    beforeEach(async () => {
      sandbox.stub(documentsConnector, 'findAll').resolves(documents);
      sandbox.stub(returnsConnector.returns, 'findAll').resolves(returns);
    });

    test('finds documents in CRM for specified company', async () => {
      await controller.getReturns(request);
      expect(documentsConnector.findAll.calledWith({
        company_entity_id: 'company_1'
      })).to.equal(true);
    });

    test('finds returns matching documents', async () => {
      await controller.getReturns(request);
      expect(returnsConnector.returns.findAll.calledWith({
        licence_ref: {
          $in: ['licence_1', 'licence_2']
        },
        'metadata->>isCurrent': 'true',
        'metadata->>isSummer': 'false',
        start_date: {
          $gte: '2018-04-01'
        },
        end_date: {
          $lte: '2019-03-31'
        },
        status: 'due'
      })).to.equal(true);
    });

    test('responds with mapped returns data', async () => {
      const response = await controller.getReturns(request);
      expect(response).to.equal([{
        licenceNumber: 'licence_1',
        returnId: 'return_1',
        startDate: '2018-04-01',
        endDate: '2019-03-31',
        frequency: 'day',
        returnRequirement: 'requirement_1',
        status: 'due'
      }]);
    });
  });
});
