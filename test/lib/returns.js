const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();

const returns = require('../../src/lib/returns');

experiment('getReturnId', () => {
  test('creates the expected string', async () => {
    const regionCode = 1;
    const licenceNumber = '123abc';
    const formatId = '1234';
    const startDate = '2018-01-01';
    const endDate = '2019-01-01';

    expect(returns.getReturnId(regionCode, licenceNumber, formatId, startDate, endDate))
      .to.equal('v1:1:123abc:1234:2018-01-01:2019-01-01');
  });
});
