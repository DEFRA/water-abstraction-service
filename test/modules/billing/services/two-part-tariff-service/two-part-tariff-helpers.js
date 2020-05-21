const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createReturn, createPurposeData } = require('../../test-data/test-return-data');
const { createChargeElement } = require('../../test-data/test-charge-element-data');
const {
  getChargeElementReturnData,
  returnPurposeMatchesElementPurpose
} = require('../../../../../src/modules/billing/services/two-part-tariff-service/two-part-tariff-helpers');

experiment('modules/charging/lib/two-part-tariff-helpers', async () => {
  experiment('.getChargeElementReturnData', async () => {
    test('if no error is passed, returns a null error', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        actualReturnQuantity: 50
      };
      const { error } = getChargeElementReturnData(chargeElement);

      expect(error).to.be.null();
    });
    test('if error is passed, returns the error', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        actualReturnQuantity: 50
      };
      const { error } = getChargeElementReturnData(chargeElement, 'bad-error');

      expect(error).to.equal('bad-error');
    });
    test('data contains the expected values', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
        actualReturnQuantity: 45.79
      };
      const { data } = getChargeElementReturnData(chargeElement);

      expect(data.chargeElementId).to.equal(chargeElement.id);
      expect(data.proRataAuthorisedQuantity).to.equal(chargeElement.proRataAuthorisedQuantity);
      expect(data.actualReturnQuantity).to.equal(chargeElement.actualReturnQuantity);
    });
    test('if actualReturnsQuantity is null, is returned as null', async () => {
      const chargeElement = {
        chargeElementId: 'test-charge-element',
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
