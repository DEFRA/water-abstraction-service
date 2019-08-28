const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

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

experiment('parseReturnId', () => {
  let parsed;

  beforeEach(async () => {
    parsed = returns.parseReturnId('v1:1:123abc:1234:2018-01-01:2019-01-01');
  });

  test('extracts the version', async () => {
    expect(parsed.version).to.equal(1);
  });

  test('extracts the region code', async () => {
    expect(parsed.regionCode).to.equal('1');
  });

  test('extracts the licence number', async () => {
    expect(parsed.licenceNumber).to.equal('123abc');
  });

  test('extracts the format id', async () => {
    expect(parsed.formatId).to.equal('1234');
  });

  test('extracts the start date', async () => {
    expect(parsed.startDate).to.equal('2018-01-01');
  });

  test('extracts the end date', async () => {
    expect(parsed.endDate).to.equal('2019-01-01');
  });
});
