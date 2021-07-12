const Joi = require('joi');
const {
  nilReturn, estimatedVolumes, meterReadings, meteredVolumes,
  estimatedSingleValue, meteredSingleValue, meteredSingleValueCustomDates,
  meteredNoMeterDetails
} = require('./return-data.json');

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { returnSchema } = require('../../../src/modules/returns/schema.js');

experiment('returnSchema', () => {
  test('It should accept a nil return', async () => {
    const { error } = Joi.validate(nilReturn, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept estimated volumes', async () => {
    const { error } = Joi.validate(estimatedVolumes, returnSchema);
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

  test('It should accept metered single volume with custom dates', async () => {
    const { error } = Joi.validate(meteredSingleValueCustomDates, returnSchema);
    expect(error).to.equal(null);
  });

  test('It should accept metered with no meter details', async () => {
    const { error } = Joi.validate(meteredNoMeterDetails, returnSchema);
    expect(error).to.equal(null);
  });
});
