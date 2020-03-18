'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();

const returnsConnector = require('../../../src/lib/connectors/returns');
const documentsConnector = require('../../../src/lib/connectors/crm/documents');

const controller = require('../../../src/modules/companies/controller');

let documents;
let returns;
let request;

experiment('modules/companies/controller', () => {
  beforeEach(async () => {
    documents = [
      { system_external_id: 'licence_1' },
      { system_external_id: 'licence_2' }
    ];

    returns = [{
      return_id: 'return_1',
      licence_ref: 'licence_1',
      start_date: '2018-04-01',
      end_date: '2019-03-31',
      return_requirement: 'requirement_1',
      returns_frequency: 'day',
      status: 'due',
      metadata: {
        description: 'Site description',
        purposes: [
          {
            alias: 'Purpose alias 1',
            primary: { code: 'P', description: 'Primary Desc 1' },
            secondary: { code: 'S', description: 'Secondary Desc 1' },
            tertiary: { code: 'T', description: 'Tertiary Desc 1' }
          },
          {
            alias: 'Purpose alias 2',
            primary: { code: 'P', description: 'Primary Desc 2' },
            secondary: { code: 'S', description: 'Secondary Desc 2' },
            tertiary: { code: 'T', description: 'Tertiary Desc 2' }
          },
          {
            primary: { code: 'P', description: 'Primary Desc 3' },
            secondary: { code: 'S', description: 'Secondary Desc 3' },
            tertiary: { code: 'T', description: 'Tertiary Desc 3' }
          }
        ]
      }
    }];

    request = {
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

    sandbox.stub(documentsConnector, 'findAll').resolves(documents);
    sandbox.stub(returnsConnector.returns, 'findAll').resolves(returns);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturns', () => {
    test('finds documents in CRM for specified company', async () => {
      await controller.getReturns(request);
      expect(documentsConnector.findAll.calledWith({
        company_entity_id: 'company_1'
      })).to.equal(true);
    });

    test('requests the expected columns', async () => {
      await controller.getReturns(request);
      const [, , columns] = returnsConnector.returns.findAll.lastCall.args;

      expect(columns).to.contain('return_id');
      expect(columns).to.contain('return_id');
      expect(columns).to.contain('licence_ref');
      expect(columns).to.contain('start_date');
      expect(columns).to.contain('end_date');
      expect(columns).to.contain('returns_frequency');
      expect(columns).to.contain('return_requirement');
      expect(columns).to.contain('status');
      expect(columns).to.contain('metadata');
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

    experiment('returns a response containing', () => {
      let returnValue;

      beforeEach(async () => {
        const response = await controller.getReturns(request);
        returnValue = response[0];
      });

      test('the licenceNumber', async () => {
        expect(returnValue.licenceNumber).to.equal('licence_1');
      });

      test('the returnId', async () => {
        expect(returnValue.returnId).to.equal('return_1');
      });

      test('the start date', async () => {
        expect(returnValue.startDate).to.equal('2018-04-01');
      });

      test('the end date', async () => {
        expect(returnValue.endDate).to.equal('2019-03-31');
      });

      test('the frequency', async () => {
        expect(returnValue.frequency).to.equal('day');
      });

      test('the return requirement', async () => {
        expect(returnValue.returnRequirement).to.equal('requirement_1');
      });

      test('the status', async () => {
        expect(returnValue.status).to.equal('due');
      });

      test('the site description', async () => {
        expect(returnValue.siteDescription).to.equal('Site description');
      });

      test('the purposes aliases or tertiary descriptions', async () => {
        expect(returnValue.purposes).to.equal([
          'Purpose alias 1',
          'Purpose alias 2',
          'Tertiary Desc 3'
        ]);
      });

      test('tolerates the absence of purposes', async () => {
        delete returns[0].metadata.purposes;

        const response = await controller.getReturns(request);

        expect(response[0].purposes).to.equal([]);
      });
    });
  });
});
