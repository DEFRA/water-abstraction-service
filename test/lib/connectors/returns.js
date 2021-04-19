const moment = require('moment');
const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const helpers = require('@envage/water-abstraction-helpers');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const config = require('../../../config');

const returns = require('../../../src/lib/connectors/returns');

experiment('connectors/returns', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'returns').value('http://test.defra/returns/1.0');
    sandbox.stub(helpers.serviceRequest, 'get').resolves();
    sandbox.stub(helpers.serviceRequest, 'delete').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getActiveReturns', () => {
    beforeEach(async () => {
      sandbox.stub(returns.returns, 'findAll').resolves({});
    });

    test('calls the returns API with correct arguments', async () => {
      const returnIds = ['a', 'b'];

      await returns.getActiveReturns(returnIds);

      const [filter, sort, columns] = returns.returns.findAll.firstCall.args;

      const today = moment().format('YYYY-MM-DD');

      expect(filter).to.equal({
        return_id: { $in: returnIds },
        end_date: { $gte: '2018-10-31', $lte: today },
        status: { $ne: 'void' },
        'metadata->>isCurrent': 'true'
      });

      expect(sort).to.equal(null);

      expect(columns).to.include(['return_id', 'status', 'due_date']);
    });

    test('when there are a large number of returns, return IDs are sent in batches of 20', async () => {
      const returnIds = [...Array(40).keys()];
      await returns.getActiveReturns(returnIds);
      expect(returns.returns.findAll.callCount).to.equal(2);

      const [firstBatchFilter] = returns.returns.findAll.firstCall.args;
      expect(firstBatchFilter.return_id.$in).to.be.an.array().length(20);
      expect(firstBatchFilter.return_id.$in[0]).to.equal(0);

      const [secondBatchFilter] = returns.returns.findAll.secondCall.args;
      expect(secondBatchFilter.return_id.$in).to.be.an.array().length(20);
      expect(secondBatchFilter.return_id.$in[0]).to.equal(20);
    });
  });

  experiment('.getCurrentDueReturns', () => {
    const response = [{
      licence_ref: '01/123'
    }, {
      licence_ref: '02/345'
    }, {
      licence_ref: '03/456'
    }];

    beforeEach(async () => {
      sandbox.stub(returns.returns, 'findAll').resolves(response);
    });

    experiment('for winter/all year returns, when no due date is specified', () => {
      beforeEach(async () => {
        await returns.getCurrentDueReturns([], {
          startDate: '2018-04-01',
          endDate: '2019-03-31',
          isSummer: false
        });
      });

      test('calls the returns API with the correct arguments', async () => {
        const [filter] = returns.returns.findAll.lastCall.args;
        expect(filter).to.equal({
          end_date: { $lte: '2019-03-31' },
          start_date: { $gte: '2018-04-01' },
          status: 'due',
          regime: 'water',
          licence_type: 'abstraction',
          'metadata->>isCurrent': 'true',
          'metadata->>isSummer': 'false'
        });
      });
    });

    experiment('for winter/all year returns, when a due date is specified', () => {
      beforeEach(async () => {
        await returns.getCurrentDueReturns([], {
          startDate: '2018-04-01',
          endDate: '2019-03-31',
          isSummer: false,
          dueDate: '2019-04-28'
        });
      });

      test('calls the returns API with the correct arguments', async () => {
        const [filter] = returns.returns.findAll.lastCall.args;
        expect(filter).to.equal({
          end_date: { $lte: '2019-03-31' },
          start_date: { $gte: '2018-04-01' },
          due_date: '2019-04-28',
          status: 'due',
          regime: 'water',
          licence_type: 'abstraction',
          'metadata->>isCurrent': 'true',
          'metadata->>isSummer': 'false'
        });
      });
    });

    experiment('for summer returns', () => {
      beforeEach(async () => {
        await returns.getCurrentDueReturns([], {
          startDate: '2018-11-01',
          endDate: '2019-10-31',
          isSummer: true,
          dueDate: '2019-11-28'
        });
      });

      test('calls the returns API with the correct arguments', async () => {
        const [filter] = returns.returns.findAll.lastCall.args;
        expect(filter).to.equal({
          end_date: { $lte: '2019-10-31' },
          start_date: { $gte: '2018-11-01' },
          due_date: '2019-11-28',
          status: 'due',
          regime: 'water',
          licence_type: 'abstraction',
          'metadata->>isCurrent': 'true',
          'metadata->>isSummer': 'true'
        });
      });
    });

    test('does not exclude any licences from result set when no licences are excluded', async () => {
      const response = await returns.getCurrentDueReturns(['01/123', '03/456'], '2019-03-31');
      expect(response).to.equal(response);
    });

    test('excludes licences from the result set when licences are excluded', async () => {
      const response = await returns.getCurrentDueReturns(['01/123', '03/456'], '2019-03-31');
      expect(response).to.equal([{ licence_ref: '02/345' }]);
    });
  });

  experiment('.deleteAcceptanceTestData', () => {
    test('makes a delete request to the expected url', async () => {
      await returns.deleteAcceptanceTestData();

      const [url] = helpers.serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`${config.services.returns}/acceptance-tests`);
    });
  });

  experiment('.getReturnsForLicence', () => {
    beforeEach(async () => {
      sandbox.stub(returns.returns, 'findAll').resolves({});
    });

    test('calls returns API with correct arguments', async () => {
      await returns.getReturnsForLicence('test-licence-id', '2019-04-01', '2020-03-31');

      const [filter] = returns.returns.findAll.lastCall.args;
      expect(filter).to.equal({
        licence_ref: 'test-licence-id',
        status: { $ne: 'void' },
        start_date: { $gte: '2019-04-01' },
        end_date: { $lte: '2020-03-31' }
      });
    });
  });

  experiment('.getLinesForReturn', () => {
    let versions;
    beforeEach(async () => {
      versions = [{
        version_id: 'relevant-version-id'
      }, {
        version_id: 'irrelevant-version-id'
      }];
      sandbox.stub(returns.versions, 'findAll').resolves(versions);
      sandbox.stub(returns.lines, 'findAll').resolves({});
    });

    test('calls versions API with correct arguments', async () => {
      await returns.getLinesForReturn({ return_id: 'test-return-id' });

      const [filter, sort] = returns.versions.findAll.lastCall.args;
      expect(filter).to.equal({
        return_id: 'test-return-id',
        current: true
      });
      expect(sort).to.equal({ version_number: -1 });
    });

    test('calls lines API with id of first version from result of versions API call', async () => {
      await returns.getLinesForReturn({ return_id: 'test-return-id' });

      const [filter] = returns.lines.findAll.lastCall.args;
      expect(filter).to.equal({ version_id: versions[0].version_id });
    });

    experiment('if version is not found', () => {
      let result;
      beforeEach(async () => {
        returns.versions.findAll.resolves([null]);
        result = await returns.getLinesForReturn({ return_id: 'test-return-id' });
      });

      test('returns null', () => {
        expect(result).to.be.null();
      });

      test('does not call lines client', () => {
        expect(returns.lines.findAll.called).to.false();
      });
    });
  });

  experiment('.getReturnsCyclesReport', () => {
    const startDate = '2020-01-01';

    beforeEach(async () => {
      await returns.getReturnsCyclesReport(startDate);
    });

    test('.calls the expected url', async () => {
      const testUrl = 'http://test.defra/returns/1.0/return-cycles/report';

      expect(helpers.serviceRequest.get.calledWith(
        testUrl, { qs: { startDate } }
      )).to.be.true();
    });
  });

  experiment('.getReturnCycleById', () => {
    const returnCycleId = 'test-id';

    beforeEach(async () => {
      await returns.getReturnCycleById(returnCycleId);
    });

    test('.calls the expected url', async () => {
      const testUrl = `http://test.defra/returns/1.0/return-cycles/${returnCycleId}`;

      expect(helpers.serviceRequest.get.calledWith(
        testUrl
      )).to.be.true();
    });
  });

  experiment('.getReturnCycleReturns', () => {
    const returnCycleId = 'test-id';

    beforeEach(async () => {
      await returns.getReturnCycleReturns(returnCycleId);
    });

    test('.calls the expected url', async () => {
      const testUrl = `http://test.defra/returns/1.0/return-cycles/${returnCycleId}/returns`;

      expect(helpers.serviceRequest.get.calledWith(
        testUrl
      )).to.be.true();
    });
  });
});
