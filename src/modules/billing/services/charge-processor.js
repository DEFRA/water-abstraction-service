
const Joi = require('@hapi/joi');

// Service models
const Agreement = require('../../../lib/models/agreement');
const Batch = require('../../../lib/models/batch');
const ChargeVersion = require('../../../lib/models/charge-version');
const Licence = require('../../../lib/models/licence');

const validators = require('../../../lib/models/validators');

const getTransactions = (batch, financialYear, chargeVersion, data) => {
  // Validation
  validators.assertIsInstanceOf(batch, Batch);
  Joi.assert(financialYear, Joi.number().positive().integer());
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
  validators.assertIsInstanceOf(data.licence, Licence);
  validators.assertIsArrayOfType(data.agreements, Agreement);
  // @TODO billing volumes
};
