const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getEndDate } = require('../../../../src/modules/import/lib/end-date');

experiment('getEndDate', () => {
  test('returns undefined if no end date set', async () => {
    const result = getEndDate({});
    expect(result).to.be.undefined();
  });

  test('returns expiry date if set', async () => {
    const result = getEndDate({
      EXPIRY_DATE: '01/04/2019'
    });
    expect(result).to.be.equal('2019-04-01');
  });

  test('returns lapsed date if set', async () => {
    const result = getEndDate({
      LAPSED_DATE: '03/09/2019'
    });
    expect(result).to.be.equal('2019-09-03');
  });

  test('returns revoked date if set', async () => {
    const result = getEndDate({
      REV_DATE: '31/12/2017'
    });
    expect(result).to.be.equal('2017-12-31');
  });

  test('ignores null string', async () => {
    const result = getEndDate({
      LAPSED_DATE: 'null',
      REV_DATE: '31/12/2017'
    });
    expect(result).to.be.equal('2017-12-31');
  });

  test('returns minumum date if all set', async () => {
    const result = getEndDate({
      EXPIRY_DATE: '01/04/2019',
      LAPSED_DATE: '03/09/2019',
      REV_DATE: '31/12/2017'
    });
    expect(result).to.be.equal('2017-12-31');
  });
});
