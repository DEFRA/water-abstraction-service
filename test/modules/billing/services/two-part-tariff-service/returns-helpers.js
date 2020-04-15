const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const returnsHelpers = require('../../../../../src/modules/billing/services/two-part-tariff-service/returns-helpers');
const returns = require('../../../../../src/lib/connectors/returns');

const { batch, licence } = require('./test-batch');

const returnsforLicence = [{
  returnId: 'test-return-id',
  licenceRef: 'test-licence'
}];

const returnsLines = [{
  start_date: '2019-04-01',
  end_date: '2019-04-30',
  quantity: 540,
  time_period: 'month'
}, {
  start_date: '2019-05-01',
  end_date: '2019-05-31',
  quantity: 740,
  time_period: 'month'
}, {
  start_date: '2019-06-01',
  end_date: '2019-06-30',
  quantity: 680,
  time_period: 'month'
}];

experiment('modules/billing/services/two-part-tariff-service/returns-helpers .getReturnsForMatching', async () => {
  let result;
  beforeEach(async () => {
    sandbox.stub(returns, 'getReturnsForLicence').resolves(returnsforLicence);
    sandbox.stub(returns, 'getLinesForReturn').resolves(returnsLines);

    result = await returnsHelpers.getReturnsForMatching(licence, batch);
  });

  afterEach(async () => sandbox.restore());

  test('gets returns for licence', async () => {
    const [licenceNumber] = returns.getReturnsForLicence.lastCall.args;
    expect(licenceNumber).to.equal(licence.licenceNumber);
  });

  test('gets correct return cycle dates for summer batch', async () => {
    const [, startDate, endDate] = returns.getReturnsForLicence.lastCall.args;
    expect(startDate).to.equal('2017-11-01');
    expect(endDate).to.equal('2018-10-31');
  });

  test('gets correct return cycle dates for winter batch', async () => {
    batch.isSummer = false;
    result = await returnsHelpers.getReturnsForMatching(licence, batch);

    const [, startDate, endDate] = returns.getReturnsForLicence.lastCall.args;
    expect(startDate).to.equal('2018-04-01');
    expect(endDate).to.equal('2019-03-31');
  });

  test('returns the returns for licence with lines', async () => {
    const camelCaseLines = [{
      startDate: returnsLines[0].start_date,
      endDate: returnsLines[0].end_date,
      quantity: returnsLines[0].quantity,
      timePeriod: returnsLines[0].time_period
    }, {
      startDate: returnsLines[1].start_date,
      endDate: returnsLines[1].end_date,
      quantity: returnsLines[1].quantity,
      timePeriod: returnsLines[1].time_period
    }, {
      startDate: returnsLines[2].start_date,
      endDate: returnsLines[2].end_date,
      quantity: returnsLines[2].quantity,
      timePeriod: returnsLines[2].time_period
    }];
    returnsforLicence[0].lines = camelCaseLines;
    expect(result).to.equal(returnsforLicence);
  });
});
