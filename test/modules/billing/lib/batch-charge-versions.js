const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { createChargeVersionYears } = require('../../../../src/modules/billing/lib/batch-charge-versions');

experiment('modules/billing/lib/charge-versions', () => {
  experiment('.createChargeVersionYears', () => {
    experiment('for a single year batch', () => {
      test('the charge versions are returned including the financial year', async () => {
        const batchChargeVersions = [
          {
            billing_batch_charge_version_id: 1,
            billing_batch_id: 101,
            charge_version_id: 11
          },
          {
            billing_batch_charge_version_id: 1,
            billing_batch_id: 101,
            charge_version_id: 22
          }
        ];

        const batch = {
          billing_batch_id: 101,
          start_financial_year: 2019,
          end_financial_year: 2019
        };

        const output = createChargeVersionYears(batch, batchChargeVersions);

        expect(output).to.have.length(2);

        expect(output[0].billing_batch_id).to.equal(101);
        expect(output[0].charge_version_id).to.equal(11);
        expect(output[0].financial_year).to.equal(2019);
        expect(output[0].status).to.equal('processing');

        expect(output[1].billing_batch_id).to.equal(101);
        expect(output[1].charge_version_id).to.equal(22);
        expect(output[1].financial_year).to.equal(2019);
        expect(output[1].status).to.equal('processing');
      });
    });

    experiment('for a multi year batch', () => {
      test('the charge versions are returned including the financial year', async () => {
        const batchChargeVersions = [
          {
            billing_batch_id: 101,
            charge_version_id: 11
          },
          {
            billing_batch_id: 101,
            charge_version_id: 22
          }
        ];

        const batch = {
          billing_batch_id: 101,
          start_financial_year: 2019,
          end_financial_year: 2020
        };

        const output = createChargeVersionYears(batch, batchChargeVersions);

        expect(output).to.have.length(4);

        expect(output[0].billing_batch_id).to.equal(101);
        expect(output[0].charge_version_id).to.equal(11);
        expect(output[0].financial_year).to.equal(2019);
        expect(output[0].status).to.equal('processing');

        expect(output[1].billing_batch_id).to.equal(101);
        expect(output[1].charge_version_id).to.equal(11);
        expect(output[1].financial_year).to.equal(2020);
        expect(output[1].status).to.equal('processing');

        expect(output[2].billing_batch_id).to.equal(101);
        expect(output[2].charge_version_id).to.equal(22);
        expect(output[2].financial_year).to.equal(2019);
        expect(output[2].status).to.equal('processing');

        expect(output[3].billing_batch_id).to.equal(101);
        expect(output[3].charge_version_id).to.equal(22);
        expect(output[3].financial_year).to.equal(2020);
        expect(output[3].status).to.equal('processing');
      });
    });
  });
});
