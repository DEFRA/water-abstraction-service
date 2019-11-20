const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { createChargeVersionYear } = require('../../../../src/modules/billing/lib/batch-charge-versions');

experiment('modules/billing/lib/charge-versions', () => {
  experiment('.createChargeVersionYear', () => {
    test('the charge version year is returned', async () => {
      const billingBatchChargeVersion = {
        date_created: '2019-11-20T16:37:51.171Z',
        date_updated: '2019-11-20T16:37:51.171Z',
        billing_batch_id: 'test-billing-batch-id',
        charge_version_id: 'test-charge-version-id',
        billing_batch_charge_version_id: 'test-billing-batch-charge-version-id'
      };

      const chargeVersionYear = createChargeVersionYear(
        billingBatchChargeVersion,
        2019
      );

      expect(chargeVersionYear.billing_batch_id).to.equal('test-billing-batch-id');
      expect(chargeVersionYear.charge_version_id).to.equal('test-charge-version-id');
      expect(chargeVersionYear.financial_year).to.equal(2019);
      expect(chargeVersionYear.status).to.equal('processing');
    });
  });
});
