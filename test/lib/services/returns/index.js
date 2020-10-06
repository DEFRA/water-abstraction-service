const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');

const apiConnector = require('../../../../src/lib/services/returns/api-connector');
const returnsService = require('../../../../src/lib/services/returns');
const returnsRequirementsService = require('../../../../src/lib/services/return-requirements');

const FinancialYear = require('../../../../src/lib/models/financial-year');
const Return = require('../../../../src/lib/models/return');
const ReturnVersion = require('../../../../src/lib/models/return-version');
const ReturnLine = require('../../../../src/lib/models/return-line');
const ReturnRequirement = require('../../../../src/lib/models/return-requirement');

const returnId = 'v1:1:01/123/456:1234567:2019-04-01:2020-03-31';
const versionId = uuid();
const licenceNumber = '01/123/456';
const financialYear = new FinancialYear(2020);

const createReturns = (overrides = {}) => (
  [{
    return_id: returnId,
    start_date: '2019-04-01',
    end_date: '2020-03-31',
    due_date: '2020-04-28',
    received_date: '2020-04-21',
    current: true,
    status: overrides.status || 'completed',
    under_query: false,
    frequency: 'day',
    metadata: {
      isSummer: true,
      purposes: [{
        tertiary: {
          code: '400'
        }
      }],
      nald: {
        regionCode: 1,
        formatId: 123,
        periodStartDay: 1,
        periodStartMonth: 5,
        periodEndDay: 31,
        periodEndMonth: 9
      }
    }
  }]
);

const createVersion = (overrides = {}) => ({
  version_id: versionId,
  return_id: returnId,
  current: true,
  nil_return: overrides.isNilReturn || false
});

const createLines = () => ([{
  line_id: uuid(),
  version_id: versionId,
  volume: 23.24,
  start_date: '2019-04-01',
  end_date: '2019-04-31',
  time_period: 'month'
}]);

const createReturnRequirement = () => {
  return new ReturnRequirement().fromHash({
    externalId: '1:123'
  });
};

experiment('lib/services/returns/index', () => {
  beforeEach(async () => {
    sandbox.stub(apiConnector, 'getReturnsForLicenceInCycle').resolves([]);
    apiConnector.getReturnsForLicenceInCycle.onCall(0).resolves(createReturns());
    sandbox.stub(apiConnector, 'getCurrentVersion').resolves(createVersion());
    sandbox.stub(apiConnector, 'getLines').resolves(createLines());
    sandbox.stub(returnsRequirementsService, 'getReturnRequirementByExternalId').resolves(createReturnRequirement());
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturnsForLicenceInFinancialYear', () => {
    let result;

    experiment('when the return has a current version with lines', async () => {
      beforeEach(async () => {
        result = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear);
      });

      test('returns are fetched from the API with the financial year date range', async () => {
        expect(apiConnector.getReturnsForLicenceInCycle.calledWith(
          licenceNumber, { startDate: '2019-04-01', endDate: '2020-03-31', isSummer: false, dueDate: '2020-10-16' }
        )).to.be.true();
        expect(apiConnector.getReturnsForLicenceInCycle.calledWith(
          licenceNumber, { startDate: '2018-11-01', endDate: '2019-10-31', isSummer: true, dueDate: '2019-11-28' }
        )).to.be.true();
      });

      test('the current return version is fetched from the API', async () => {
        expect(apiConnector.getCurrentVersion.calledWith(
          returnId
        )).to.be.true();
      });

      test('the lines for the current return version are fetched from the API', async () => {
        expect(apiConnector.getLines.calledWith(
          versionId
        )).to.be.true();
      });

      test('the return requirements are fetched using an external ID using the NALD region code and format ID', async () => {
        expect(returnsRequirementsService.getReturnRequirementByExternalId.calledWith(
          '1:123'
        )).to.be.true();
      });

      test('resolves with array of return service models', async () => {
        expect(result).to.be.an.array().length(1);
        expect(result[0] instanceof Return).to.be.true();
      });

      test('the return has a version', async () => {
        const { returnVersions } = result[0];
        expect(returnVersions).to.be.an.array().length(1);
        expect(returnVersions[0] instanceof ReturnVersion).to.be.true();
      });

      test('the version has lines', async () => {
        const { returnLines } = result[0].returnVersions[0];
        expect(returnLines).to.be.an.array().length(1);
        expect(returnLines[0] instanceof ReturnLine).to.be.true();
      });
    });

    experiment('when the return is incomplete', async () => {
      beforeEach(async () => {
        apiConnector.getReturnsForLicenceInCycle.onCall(0).resolves(createReturns({ status: 'due' }));
        result = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear);
      });

      test('return versions are not fetched from the API', async () => {
        expect(apiConnector.getCurrentVersion.called).to.be.false();
      });

      test('lines are not fetched from the API', async () => {
        expect(apiConnector.getLines.called).to.be.false();
      });

      test('the return has no versions', async () => {
        expect(result[0].returnVersions[0]).to.be.undefined();
      });
    });

    experiment('when there are no return versions', async () => {
      beforeEach(async () => {
        apiConnector.getCurrentVersion.resolves();
        result = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear);
      });

      test('lines are not loaded', async () => {
        expect(apiConnector.getLines.called).to.be.false();
      });

      test('the return has no versions', async () => {
        expect(result[0].returnVersions[0]).to.be.undefined();
      });
    });

    experiment('when there is a nil return', async () => {
      beforeEach(async () => {
        apiConnector.getCurrentVersion.resolves(createVersion({ isNilReturn: true }));
        result = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear);
      });

      test('lines are not loaded', async () => {
        expect(apiConnector.getLines.called).to.be.false();
      });

      test('the return has a version', async () => {
        const { returnVersions } = result[0];
        expect(returnVersions).to.be.an.array().length(1);
        expect(returnVersions[0] instanceof ReturnVersion).to.be.true();
      });

      test('the version has no lines', async () => {
        const { returnLines } = result[0].returnVersions[0];
        expect(returnLines).to.be.an.array().length(0);
      });
    });
  });
});
