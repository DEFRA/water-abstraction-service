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
    sandbox.stub(helpers.serviceRequest, 'delete').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getActiveReturns', () => {
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
  });

  experiment('getCurrentDueReturns', () => {
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

    test('calls the returns API with the correct arguments', async () => {
      await returns.getCurrentDueReturns([], '2019-03-31');

      const [filter] = returns.returns.findAll.lastCall.args;
      expect(filter).to.equal({
        end_date: { $lte: '2019-03-31' },
        start_date: { $gte: '2018-04-01' },
        due_date: '2019-04-28',
        status: 'due',
        regime: 'water',
        licence_type: 'abstraction',
        'metadata->>isCurrent': 'true'
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

  experiment('.voidReturns', () => {
    beforeEach(async () => {
      sandbox.stub(helpers.serviceRequest, 'patch').resolves({});
    });

    test('passes the expected data', async () => {
      await returns.voidReturns('test-licence-id', [
        'valid-return-id-2',
        'valid-return-id-1'
      ]);

      const [, data] = helpers.serviceRequest.patch.lastCall.args;
      expect(data.body.licenceNumber).to.equal('test-licence-id');
      expect(data.body.validReturnIds).to.equal([
        'valid-return-id-2',
        'valid-return-id-1'
      ]);
      expect(data.body.regime).to.equal('water');
      expect(data.body.licenceType).to.equal('abstraction');
    });

    test('does not make the request for no return ids', async () => {
      await returns.voidReturns('test-licence-id', []);
      expect(helpers.serviceRequest.patch.called).to.be.false();
    });
  });

  experiment('.deleteAcceptanceTestData', () => {
    test('makes a delete request to the expected url', async () => {
      await returns.deleteAcceptanceTestData();

      const [url] = helpers.serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`${config.services.returns}/acceptance-tests`);
    });
  });
});
