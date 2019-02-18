const Joi = require('joi');
const {
  nilReturn, estimatedVolumes, meterReadings, meteredVolumes,
  estimatedSingleValue, meteredSingleValue
} = require('./return-data.json');

const { pick } = require('lodash');

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { returnSchema, multipleSchema } = require('../../../src/modules/returns/schema.js');

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
});

const createMultipleReturn = (ret) => {
  const modified = pick(ret, [
    'returnId',
    'licenceNumber',
    'startDate',
    'endDate',
    'isNil',
    'lines',
    'receivedDate',
    'frequency',
    'meters'
  ]);

  // Remove multiplier from meter
  modified.meters = (modified.meters || []).map(meter => {
    const { multiplier, ...rest } = meter;
    return rest;
  });

  return modified;
};

experiment('multipleSchema', () => {
  test('It should accept a nil return', async () => {
    const { error } = Joi.validate(createMultipleReturn(nilReturn), multipleSchema);
    expect(error).to.equal(null);
  });

  test('It should accept estimated volumes', async () => {
    const ret = createMultipleReturn(estimatedVolumes);
    const { error } = Joi.validate(ret, multipleSchema);
    expect(error).to.equal(null);
  });

  test('It should accept metered volumes', async () => {
    const { error } = Joi.validate(createMultipleReturn(meteredVolumes), multipleSchema);
    expect(error).to.equal(null);
  });
});
