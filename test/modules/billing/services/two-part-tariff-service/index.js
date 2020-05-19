const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const { calculateVolumes } = require('../../../../../src/modules/billing/services/two-part-tariff-service');
const returnsHelpers = require('../../../../../src/modules/billing/services/two-part-tariff-service/returns-helpers');
const twoPartTariffMatching = require('../../../../../src/modules/billing/services/two-part-tariff-service/two-part-tariff-matching');

const { createChargeVersion, createChargeElement } = require('../../test-data/test-billing-data');

const returns = [
  {
    returnId: 'test-return-id',
    lines: [{
      startDate: '2019-04-01',
      endDate: '2019-04-30',
      quantity: 540,
      timePeriod: 'month'
    }, {
      startDate: '2019-05-01',
      endDate: '2019-05-31',
      quantity: 740,
      timePeriod: 'month'
    }, {
      startDate: '2019-06-01',
      endDate: '2019-06-30',
      quantity: 680,
      timePeriod: 'month'
    }]
  }];

const matchingResults = {
  error: null,
  data: [{
    error: null,
    data: {
      chargeElementId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      actualReturnQuantity: 1.96
    }
  }]
};

experiment('modules/billing/services/two-part-tariff-service .calculateVolumes', async () => {
  let result, chargeElement;
  beforeEach(async () => {
    sandbox.stub(returnsHelpers, 'getReturnsForMatching').resolves(returns);
    sandbox.stub(twoPartTariffMatching, 'matchReturnsToChargeElements').returns(matchingResults);

    chargeElement = [createChargeElement({ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' })];
    result = await calculateVolumes(createChargeVersion(chargeElement), 2019, true);
  });

  afterEach(async () => sandbox.restore());

  test('calls returns helpers with correct arguments to get returns data', async () => {
    const [licenceNumber, financialYear, isSummer] = returnsHelpers.getReturnsForMatching.lastCall.args;
    expect(licenceNumber).to.equal('01/123/ABC');
    expect(financialYear).to.equal(2019);
    expect(isSummer).to.equal(true);
  });

  test('passes charge elements and returns data to matching algorithm', async () => {
    const [chargeElements, returnsForMatching] = twoPartTariffMatching.matchReturnsToChargeElements.lastCall.args;
    expect(chargeElements).to.equal(chargeElement);
    expect(returnsForMatching).to.equal(returns);
  });

  test('returns the result of the matching algorithm', async () => {
    expect(result).to.be.an.object();
    expect(result.data[0].data.chargeElementId).to.equal('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(result.data[0].data.actualReturnQuantity).to.equal(1.96);
  });
});
