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

  test('IsCurrent is true if the currentVersion is supplied', async () => {
    const currentVersion = {
      expiry_date: moment().add(2, 'months').format('YYYYMMDD'),
      version_effective_date: moment().subtract(1, 'month').format('YYYYMMDD'),
      party: {},
      address: {}
    };

    const meta = buildCRMMetadata(currentVersion);
    expect(meta.IsCurrent).to.be.true();
    expect(meta.Expires).to.equal(currentVersion.expiry_date);
    expect(meta.Modified).to.equal(currentVersion.version_effective_date);
  });
});
