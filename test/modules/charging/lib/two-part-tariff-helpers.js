const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getChargeElement } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const {
  getAbsPeriod,
  returnPurposeMatchesElementPurpose
} = require('../../../../src/modules/charging/lib/two-part-tariff-helpers');

const createReturnLine = options => {
  return {
    startDate: options.startDate,
    endDate: options.endDate,
    frequency: options.frequency,
    quantity: options.quantity,
    quantityAllocated: options.quantityAllocated
  };
};

experiment('modules/charging/lib/two-part-tariff-helpers', async () => {

});
