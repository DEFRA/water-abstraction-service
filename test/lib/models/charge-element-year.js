const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const ChargeVersionYear = require('../../../src/lib/models/charge-version-year');

experiment('lib/models/charge-version-year', () => {
  experiment('.CHARGE_VERSION_YEAR_STATUS', () => {
    test('contains the expected keys for each status', async () => {
      expect(Object.keys(ChargeVersionYear.CHARGE_VERSION_YEAR_STATUS))
        .to.only.include(['processing', 'ready', 'error']);
    });
  });
});
