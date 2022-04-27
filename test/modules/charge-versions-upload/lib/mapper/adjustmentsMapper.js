const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { mapToAdjustments } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/adjustmentsMapper');

experiment('mapToAdjustments', () => {
  const expectedAdjustments = {
    s126: null,
    s127: false,
    s130: false,
    charge: null,
    winter: false,
    aggregate: null
  };

  const adjustmentData = {
    chargeReferenceDetailsAggregateFactor: '1',
    chargeReferenceDetailsAdjustmentFactor: '1',
    chargeReferenceDetailsAbatementFactor: '',
    chargeReferenceDetailsWinterDiscount: 'N',
    chargeReferenceDetailsTwoPartTariffAgreementApplies: 'N',
    chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: 'N'
  };

  test('when adjustments have not been entered', async () => {
    expect(mapToAdjustments(adjustmentData)).to.equal({});
  });

  test('when aggregate factor is between 0 and 1', async () => {
    expect(mapToAdjustments({
      ...adjustmentData,
      chargeReferenceDetailsAggregateFactor: '0.5'
    })).to.equal({
      ...expectedAdjustments,
      aggregate: '0.5'
    });
  });

  test('when adjustment factor is between 0 and 1', async () => {
    expect(mapToAdjustments({
      ...adjustmentData,
      chargeReferenceDetailsAdjustmentFactor: '0.000000000000005'
    })).to.equal({
      ...expectedAdjustments,
      charge: '0.000000000000005'
    });
  });

  test('when adjustment factor is between 0 and 1', async () => {
    expect(mapToAdjustments({
      ...adjustmentData,
      chargeReferenceDetailsAbatementFactor: '0.5'
    })).to.equal({
      ...expectedAdjustments,
      s126: '0.5'
    });
  });

  test('when winter discount is set to Y', async () => {
    expect(mapToAdjustments({
      ...adjustmentData,
      chargeReferenceDetailsWinterDiscount: 'Y'
    })).to.equal({
      ...expectedAdjustments,
      winter: true
    });
  });

  test('when two part tariff agreement applies is set to Y', async () => {
    expect(mapToAdjustments({
      ...adjustmentData,
      chargeReferenceDetailsTwoPartTariffAgreementApplies: 'Y'
    })).to.equal({
      ...expectedAdjustments,
      s127: true
    });
  });

  test('when canal and river trust agreement applies is set to Y', async () => {
    expect(mapToAdjustments({
      ...adjustmentData,
      chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: 'Y'
    })).to.equal({
      ...expectedAdjustments,
      s130: true
    });
  });
});
