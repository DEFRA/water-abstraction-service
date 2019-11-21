const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const {
  isSupplementaryBatch,
  isAnnualBatch,
  isTwoPartTariffBatch,
  batchTypes
} = require('../../../../src/modules/billing/lib/batch');

experiment('modules/billing/lib/batch', () => {
  experiment('.isSupplementaryBatch', () => {
    test('returns true for a supplementary batch', async () => {
      const batch = { batch_type: batchTypes.supplementary };
      expect(isSupplementaryBatch(batch)).to.be.true();
    });

    test('returns false for an annual batch', async () => {
      const batch = { batch_type: batchTypes.annual };
      expect(isSupplementaryBatch(batch)).to.be.false();
    });

    test('returns false for a two part tariff batch', async () => {
      const batch = { batch_type: batchTypes.twoPartTariff };
      expect(isSupplementaryBatch(batch)).to.be.false();
    });
  });

  experiment('.isAnnualBatch', () => {
    test('returns true for an annual batch', async () => {
      const batch = { batch_type: batchTypes.annual };
      expect(isAnnualBatch(batch)).to.be.true();
    });

    test('returns false for a supplementary batch', async () => {
      const batch = { batch_type: batchTypes.supplementary };
      expect(isAnnualBatch(batch)).to.be.false();
    });

    test('returns false for a two part tariff batch', async () => {
      const batch = { batch_type: batchTypes.twoPartTariff };
      expect(isAnnualBatch(batch)).to.be.false();
    });
  });

  experiment('.isTwoPartTariffBatch', () => {
    test('returns false for an annual batch', async () => {
      const batch = { batch_type: batchTypes.annual };
      expect(isTwoPartTariffBatch(batch)).to.be.false();
    });

    test('returns false for a supplementary batch', async () => {
      const batch = { batch_type: batchTypes.supplementary };
      expect(isTwoPartTariffBatch(batch)).to.be.false();
    });

    test('returns true for a two part tariff batch', async () => {
      const batch = { batch_type: batchTypes.twoPartTariff };
      expect(isTwoPartTariffBatch(batch)).to.be.true();
    });
  });
});
