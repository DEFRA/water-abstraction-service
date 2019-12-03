const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { matchReturnsToChargeElements } = require('../../../../src/modules/charging/lib/two-part-tariff-matching');
const {
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE
} = require('../../../../src/modules/charging/lib/two-part-tariff-helpers');
const sampleData1 = require('./sample-data/two-due-rets-two-tpt-ce');
const sampleData2 = require('./sample-data/two-ret-one-nil-one-ce');
const sampleData3 = require('./sample-data/two-ret-four-ce-three-purposes');

experiment('2PT Returns Matching - Sample Data', async () => {
  experiment('two-due-rets-one-tpt-ce', async () => {
    test('returns null actualReturnQuantities', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData1.chargeVersion, sampleData1.returns);

      expect(error).to.equal(ERROR_NO_RETURNS_SUBMITTED);
      expect(data).to.be.an.array().and.to.have.length(2);
      expect(data[0].data.actualReturnQuantity).to.be.null();
      expect(data[0].error).to.be.null();
      expect(data[1].data.actualReturnQuantity).to.be.null();
      expect(data[1].error).to.be.null();
    });
  });
  experiment('two-ret-one-nil-one-ce', async () => {
    test('returns expected actualReturnQuantity', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData2.chargeVersion, sampleData2.returns);

      expect(error).to.be.null();
      expect(data).to.be.an.array().and.to.have.length(1);
      expect(data[0].data.actualReturnQuantity).to.equal(11.714);
      expect(data[0].error).to.be.null();
    });
  });
  experiment('two-ret-four-ce-three-purposes', async () => {
    test('returns expected error and null actualReturnQuantity', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData3.chargeVersion, sampleData3.returns);

      expect(error).to.equal(ERROR_SOME_RETURNS_DUE);
      expect(data).to.be.an.array().and.to.have.length(3);
      expect(data[0].data.actualReturnQuantity).to.be.null();
      expect(data[0].error).to.be.null();
      expect(data[1].data.actualReturnQuantity).to.be.null();
      expect(data[1].error).to.be.null();
      expect(data[2].data.actualReturnQuantity).to.be.null();
      expect(data[2].error).to.be.null();
    });
  });
});
