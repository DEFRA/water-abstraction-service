const Joi = require('joi');
const {
  nilReturn, estimatedAmounts, meterReadings, meteredVolumes,
  estimatedSingleValue, meteredSingleValue
} = require('./return-data.json');

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { returnSchema } = require('../../../src/modules/returns/schema.js');

experiment('returnSchema', () => {
  test('It should accept a nil return', async () => {
    const { error } = Joi.validate(nilReturn, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept estimated volumes', async () => {
    const { error } = Joi.validate(estimatedAmounts, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept estimated single volume', async () => {
    const { error } = Joi.validate(estimatedSingleValue, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept meter readings', async () => {
    const { error } = Joi.validate(meterReadings, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept metered volumes', async () => {
    const { error } = Joi.validate(meteredVolumes, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept metered single volume', async () => {
    const { error } = Joi.validate(meteredSingleValue, returnSchema);
    expect(error).to.equal(null);
  });
});
