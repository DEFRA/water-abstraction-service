const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { matchReturnsToChargeElements } = require('../../../../../src/modules/billing/jobs/two-part-tariff/two-part-tariff-matching');
const {
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE
} = require('../../../../../src/modules/billing/jobs/two-part-tariff/two-part-tariff-helpers');
const sampleData1 = require('./sample-data/two-due-rets-two-tpt-ce');
const sampleData2 = require('./sample-data/two-ret-one-nil-one-ce');
const sampleData3 = require('./sample-data/two-ret-four-ce-three-purposes');
const sampleData4 = require('./sample-data/one-ret-one-ce');
const sampleData5 = require('./sample-data/one-ret-three-ce');
const sampleData6 = require('./sample-data/one-ret-one-ce-2');

experiment('2PT Returns Matching - Sample Data', async () => {
  experiment('Two due returns, two TPT charge elements', async () => {
    test('returns expected error and null actualReturnQuantities', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData1.chargeVersion, sampleData1.returns);

      expect(error).to.equal(ERROR_NO_RETURNS_SUBMITTED);
      expect(data).to.be.an.array().and.to.have.length(2);
      expect(data[0].data.actualReturnQuantity).to.be.null();
      expect(data[0].error).to.be.null();
      expect(data[1].data.actualReturnQuantity).to.be.null();
      expect(data[1].error).to.be.null();
    });
  });
  experiment('Two returns, one nil return, one charge element', async () => {
    test('returns null error and expected actualReturnQuantity', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData2.chargeVersion, sampleData2.returns);

      expect(error).to.be.null();
      expect(data).to.be.an.array().and.to.have.length(1);
      expect(data[0].data.actualReturnQuantity).to.equal(11.714);
      expect(data[0].error).to.be.null();
    });
  });
  experiment('Two returns, four charge elements with three different purposes', async () => {
    test('returns expected error and null actualReturnQuantities', async () => {
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
  experiment('One return, one charge element', async () => {
    test('returns null error and expedcted actualReturnQuantity', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData4.chargeVersion, sampleData4.returns);

      expect(error).to.be.null();
      expect(data).to.be.an.array().and.to.have.length(1);
      expect(data[0].data.actualReturnQuantity).to.equal(3.844);
      expect(data[0].error).to.be.null();
    });
  });
  experiment('One return, three charge elements', async () => {
    test('returns expected actualReturnQuantities for each element', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData5.chargeVersion, sampleData5.returns);

      const [chargeElement1] = data.filter(ele => ele.data.chargeElementId === 'charge-element-1');
      const [chargeElement2] = data.filter(ele => ele.data.chargeElementId === 'charge-element-2');
      const [chargeElement3] = data.filter(ele => ele.data.chargeElementId === 'charge-element-3');

      expect(error).to.be.null();
      expect(data).to.be.an.array().and.to.have.length(3);
      expect(chargeElement1.data.actualReturnQuantity).to.equal(24.63);
      expect(chargeElement2.data.actualReturnQuantity).to.equal(0);
      expect(chargeElement3.data.actualReturnQuantity).to.equal(0);
      expect(data[0].error).to.be.null();
      expect(data[1].error).to.be.null();
      expect(data[2].error).to.be.null();
    });
  });
  experiment('One return, one charge element', async () => {
    test('returns null error and expedcted actualReturnQuantity', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData6.chargeVersion1, sampleData6.returns);

      expect(error).to.be.null();
      expect(data).to.be.an.array().and.to.have.length(1);
      expect(data[0].data.actualReturnQuantity).to.equal(13.974);
      expect(data[0].error).to.be.null();
    });
    test('returns null error and expedcted actualReturnQuantity', async () => {
      const { error, data } = matchReturnsToChargeElements(sampleData6.chargeVersion2, sampleData6.returns);

      expect(error).to.be.null();
      expect(data).to.be.an.array().and.to.have.length(1);
      expect(data[0].data.actualReturnQuantity).to.equal(53.694);
      expect(data[0].error).to.be.null();
    });
  });
});
