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
    const { error } = returnSchema.validate(nilReturn);
    expect(error).to.equal(null);
  });

  test('It should accept estimated volumes', async () => {
    const { error } = returnSchema.validate(estimatedVolumes);
    expect(error).to.equal(null);
  });

  test('It should accept estimated single volume', async () => {
    const { error } = returnSchema.validate(estimatedSingleValue);
    expect(error).to.equal(null);
  });

  test('It should accept meter readings', async () => {
    const { error } = returnSchema.validate(meterReadings);
    expect(error).to.equal(null);
  });

  test('It should accept metered volumes', async () => {
    const { error } = returnSchema.validate(meteredVolumes);
    expect(error).to.equal(null);
  });

  test('It should accept metered single volume', async () => {
    const { error } = returnSchema.validate(meteredSingleValue);
    expect(error).to.equal(null);
  });

  test('It should accept metered single volume with custom dates', async () => {
    const { error } = returnSchema.validate(meteredSingleValueCustomDates);
    expect(error).to.equal(null);
  });

  test('It should accept metered with no meter details', async () => {
    const { error } = returnSchema.validate(meteredNoMeterDetails);
    expect(error).to.equal(null);
  });
});
