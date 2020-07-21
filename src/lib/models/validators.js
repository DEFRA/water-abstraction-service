'use strict';

const { isArray, isObject } = require('lodash');
const hoek = require('@hapi/hoek');
const Joi = require('joi');

const assert = (value, schema) => Joi.assert(value, schema, { convert: false });

const dateRegex = /^\d{4}-([0][1-9]|[1][0-2])-([0][1-9]|[1-2][0-9]|[3][0-1])$/;
const { returnIDRegex } = require('@envage/water-abstraction-helpers').returns;

const VALID_DATE = Joi.string().regex(dateRegex).required();
const VALID_NULLABLE_DATE = VALID_DATE.allow(null);
const VALID_ACCOUNT_NUMBER = Joi.string().regex(/^[ABENSTWY][0-9]{8}A$/).required();
const VALID_LICENCE_NUMBER = Joi.string().regex(/^[&()*-./0-9A-Z]+$/).required();
const VALID_GUID = Joi.string().guid().required();
const VALID_STRING = Joi.string().required();
const VALID_NULLABLE_STRING = VALID_STRING.allow(null);
const VALID_INTEGER = Joi.number().integer();
const VALID_POSITIVE_INTEGER = VALID_INTEGER.positive();
const VALID_AGREEMENT_CODE = Joi.string().valid('S126', 'S127', 'S130', 'S130U', 'S130S', 'S130T', 'S130W');
const VALID_DAY = VALID_POSITIVE_INTEGER.max(31);
const VALID_MONTH = VALID_POSITIVE_INTEGER.max(12);
const VALID_QUANTITY = Joi.number().min(0);
const VALID_NULLABLE_QUANTITY = VALID_QUANTITY.allow(null);
const VALID_ISO_DATE_STRING = Joi.string().isoDate();
const VALID_FACTOR = Joi.number().min(0).max(1);
const VALID_TRANSACTION_KEY = Joi.string().hex().length(32).allow(null);
const VALID_NEGATIVE_INTEGER = VALID_INTEGER.negative();
const VALID_EMAIL_ADDRESS = Joi.string().email();
const VALID_RETURN_ID = Joi.string().regex(returnIDRegex);

const assertIsArrayOfType = (values, Type) => {
  hoek.assert(isArray(values), 'Array expected');
  values.forEach((value, i) =>
    hoek.assert(value instanceof Type, `${new Type().constructor.name} expected at position ${i}`)
  );
};

const assertIsArrayOfNullableStrings = (values) => {
  hoek.assert(isArray(values), 'Array expected');
  values.forEach((value, i) =>
    hoek.assert(typeof value === 'string' || value === null, `String expected at position ${i}`)
  );
};

const assertIsInstanceOf = (value, Type) => {
  hoek.assert(value instanceof Type, `${new Type().constructor.name} expected`);
};

const assertIsNullableInstanceOf = (value, Type) => {
  if (value !== null) {
    assertIsInstanceOf(value, Type);
  }
};

const assertAccountNumber = accountNumber => assert(accountNumber, VALID_ACCOUNT_NUMBER);
const assertLicenceNumber = licenceNumber => assert(licenceNumber, VALID_LICENCE_NUMBER);
const assertId = id => assert(id, VALID_GUID);
const assertString = value => assert(value, VALID_STRING);
const assertNullableString = value => assert(value, VALID_NULLABLE_STRING);
const assertIsBoolean = value => assert(value, Joi.boolean().required());
const assertDate = date => assert(date, VALID_DATE);
const assertNullableDate = date => assert(date, VALID_NULLABLE_DATE);
const assertEnum = (str, values) => assert(str, VALID_STRING.valid(values));
const assertNullableEnum = (str, values) => assert(str, VALID_NULLABLE_STRING.valid(values));
const assertAuthorisedDays = value => assert(value, VALID_POSITIVE_INTEGER.max(366));
const assertBillableDays = value => assert(value, VALID_INTEGER.min(0).max(366));
const assertPositiveInteger = value => assert(value, VALID_POSITIVE_INTEGER);
const assertAgreementCode = value => assert(value, VALID_AGREEMENT_CODE);
const assertDay = value => assert(value, VALID_DAY);
const assertMonth = value => assert(value, VALID_MONTH);
const assertQuantity = value => assert(value, VALID_QUANTITY);
const assertNullableQuantity = value => assert(value, VALID_NULLABLE_QUANTITY);
const assertIsoString = value => assert(value, VALID_ISO_DATE_STRING);
const assertFactor = value => assert(value, VALID_FACTOR);
const assertTransactionKey = value => assert(value, VALID_TRANSACTION_KEY);
const assertPositiveOrZeroInteger = value => assert(value, VALID_POSITIVE_INTEGER.allow(0));
const assertNegativeOrZeroInteger = value => assert(value, VALID_NEGATIVE_INTEGER.allow(0));
const assertInteger = value => assert(value, VALID_INTEGER);
const assertEmailAddress = value => assert(value, VALID_EMAIL_ADDRESS);
const assertIsNullableBoolean = value => assert(value, Joi.boolean().required().allow(null));
const assertNullableQuantityWithMaximum = (value, max) => assert(value, VALID_NULLABLE_QUANTITY.max(max));
const assertReturnId = value => assert(value, VALID_RETURN_ID);

exports.assertIsBoolean = assertIsBoolean;
exports.assertIsInstanceOf = assertIsInstanceOf;
exports.assertIsNullableInstanceOf = assertIsNullableInstanceOf;
exports.assertIsArrayOfType = assertIsArrayOfType;
exports.assertIsArrayOfNullableStrings = assertIsArrayOfNullableStrings;
exports.assertAccountNumber = assertAccountNumber;
exports.assertLicenceNumber = assertLicenceNumber;
exports.assertId = assertId;
exports.assertString = assertString;
exports.assertNullableString = assertNullableString;
exports.assertDate = assertDate;
exports.assertNullableDate = assertNullableDate;
exports.assertEnum = assertEnum;
exports.assertNullableEnum = assertNullableEnum;
exports.assertAuthorisedDays = assertAuthorisedDays;
exports.assertBillableDays = assertBillableDays;
exports.assertPositiveInteger = assertPositiveInteger;
exports.assertAgreementCode = assertAgreementCode;
exports.assertDay = assertDay;
exports.assertMonth = assertMonth;
exports.assertQuantity = assertQuantity;
exports.assertNullableQuantity = assertNullableQuantity;
exports.assertIsoString = assertIsoString;
exports.assertFactor = assertFactor;
exports.assertTransactionKey = assertTransactionKey;
exports.assertPositiveOrZeroInteger = assertPositiveOrZeroInteger;
exports.assertNegativeOrZeroInteger = assertNegativeOrZeroInteger;
exports.assertInteger = assertInteger;
exports.assertEmailAddress = assertEmailAddress;
exports.assertIsNullableBoolean = assertIsNullableBoolean;
exports.assertNullableQuantityWithMaximum = assertNullableQuantityWithMaximum;
exports.assertReturnId = assertReturnId;
