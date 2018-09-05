const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');
const moment = require('moment');

const { buildCRMMetadata } = require('../../../../src/modules/import/transform-crm');

experiment('buildCRMMetadata', () => {
  test('returns a default object if the current version is falsy', async () => {
    const meta = buildCRMMetadata();
    expect(meta).to.equal({
      IsCurrent: false
    });
  });

  test('IsCurrent is false if the currentVersion has not started', async () => {
    const currentVersion = {
      expiry_date: moment().add(2, 'months').format('YYYYMMDD'),
      version_effective_date: moment().add(1, 'month').format('YYYYMMDD'),
      party: {},
      address: {}
    };

    const meta = buildCRMMetadata(currentVersion);
    expect(meta.IsCurrent).to.be.false();
  });

  test('IsCurrent is false if the currentVersion has ended', async () => {
    const currentVersion = {
      expiry_date: moment().subtract(1, 'months').format('YYYYMMDD'),
      version_effective_date: moment().subtract(2, 'month').format('YYYYMMDD'),
      party: {},
      address: {}
    };

    const meta = buildCRMMetadata(currentVersion);
    expect(meta.IsCurrent).to.be.false();
  });

  test('IsCurrent is true if the currentVersion has started but not ended', async () => {
    const currentVersion = {
      expiry_date: moment().add(1, 'months').format('YYYYMMDD'),
      version_effective_date: moment().subtract(1, 'month').format('YYYYMMDD'),
      party: {},
      address: {}
    };

    const meta = buildCRMMetadata(currentVersion);
    expect(meta.IsCurrent).to.be.true();
  });
});
