const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createReturn, createPurposeData } = require('./test-return-data');
const { createChargeElement } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const {
  ERROR_UNDER_QUERY,
  ERROR_NO_RETURNS_SUBMITTED,
  returnsError,
  getChargeElementReturnData,
  returnPurposeMatchesElementPurpose
} = require('../../../../src/modules/charging/lib/two-part-tariff-helpers');

experiment('modules/charging/lib/two-part-tariff-helpers', async () => {
  experiment('.returnsError', async () => {
    test('returns the error if it does not require a null return', async () => {
      const { error, data } = returnsError(ERROR_UNDER_QUERY);

      expect(error).to.equal(ERROR_UNDER_QUERY);
      expect(data).to.be.null();
    });

    test('returns the error and a null return if one is required', async () => {
      const chargeElement1 = createChargeElement({ chargeElementId: 'charge-element-1' });
      const chargeElement2 = createChargeElement({ chargeElementId: 'charge-element-2' });
      const { error, data } = returnsError(ERROR_NO_RETURNS_SUBMITTED,
        [chargeElement1, chargeElement2]);

      expect(error).to.equal(ERROR_NO_RETURNS_SUBMITTED);
      expect(data).to.be.an.array().and.to.have.length(2);
      expect(data[0].data.chargeElementId).to.equal(chargeElement1.chargeElementId);
      expect(data[0].data.actualReturnQuantity).to.be.null();
      expect(data[0].error).to.be.null();
      expect(data[1].data.chargeElementId).to.equal(chargeElement2.chargeElementId);
      expect(data[1].data.actualReturnQuantity).to.be.null();
      expect(data[1].error).to.be.null();
    });
  });

  experiment('.getChargeElementReturnData', async () => {
    test('if no error is passed, returns a null error', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        proRataAuthorisedQuantity: 50,
        actualReturnQuantity: 50
      };
      const { error } = getChargeElementReturnData(chargeElement);

      expect(error).to.be.null();
    });
    test('if error is passed, returns the error', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        proRataAuthorisedQuantity: 50,
        actualReturnQuantity: 50
      };
      const { error } = getChargeElementReturnData(chargeElement, 'bad-error');

      expect(error).to.equal('bad-error');
    });
    test('data contains the expected values', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        proRataAuthorisedQuantity: 50,
        proRataBillableQuantity: 50,
        actualReturnQuantity: 45.79
      };
      const { data } = getChargeElementReturnData(chargeElement);

      expect(data.chargeElementId).to.equal(chargeElement.chargeElementId);
      expect(data.proRataAuthorisedQuantity).to.equal(chargeElement.proRataAuthorisedQuantity);
      expect(data.proRataBillableQuantity).to.equal(chargeElement.proRataBillableQuantity);
      expect(data.actualReturnQuantity).to.equal(chargeElement.actualReturnQuantity);
    });
    test('if no proRataBillableQuantity is passed, it is returned as null', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        proRataAuthorisedQuantity: 50,
        actualReturnQuantity: 50
      };
      const { data } = getChargeElementReturnData(chargeElement);

      expect(data.proRataBillableQuantity).to.be.null();
    });
    test('if actualReturnsQuantity is null, is returned as null', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        proRataAuthorisedQuantity: 50,
        actualReturnQuantity: null
      };
      const { data } = getChargeElementReturnData(chargeElement);

      expect(data.actualReturnQuantity).to.be.null();
    });
  });

  experiment('.returnPurposeMatchesElementPurpose', async () => {
    const chargeElement = createChargeElement({
      purposeTertiary: 400
    });
    const purpose120 = createPurposeData('120');
    test('return true if at least one of the return purposes is a TPT', async () => {
      const purpose400 = createPurposeData('400');
      const ret = createReturn({ purposes: purpose400.concat(purpose120) });
      expect(returnPurposeMatchesElementPurpose(ret, chargeElement)).to.be.true();
    });
    test('return false if none of the purposes are TPT', async () => {
      const purpose600 = createPurposeData('600');
      const ret = createReturn({ purposes: purpose600.concat(purpose120) });
      expect(returnPurposeMatchesElementPurpose(ret, chargeElement)).to.be.false();
    });
  });
});
