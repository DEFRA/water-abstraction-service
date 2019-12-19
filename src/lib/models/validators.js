const { isArray } = require('lodash');
const { assert } = require('@hapi/hoek');
const Joi = require('joi');

const dateRegex = /^\d{4}-([0][1-9]|[1][0-2])-([0][1-9]|[1-2][0-9]|[3][0-1])$/;

const VALID_DATE = Joi.string().regex(dateRegex).required();
const VALID_ACCOUNT_NUMBER = Joi.string().regex(/^[ABENSTWY][0-9]{8}A$/).required();
const VALID_LICENCE_NUMBER = Joi.string().regex(/^[&()*-./0-9A-Z]+$/).required();
const VALID_GUID = Joi.string().guid().required();
const VALID_NULLABLE_STRING = Joi.string().allow(null).required();

const assertIsArrayOfType = (values, Type) => {
  assert(isArray(values), 'Array expected');
  values.forEach((value, i) =>
    assert(value instanceof Type, `${new Type().constructor.name} expected at position ${i}`)
  );
};

const assertIsInstanceOf = (value, Type) => {
  assert(value instanceof Type, `${new Type().constructor.name} expected`);
};

const assertAccountNumber = accountNumber => Joi.assert(accountNumber, VALID_ACCOUNT_NUMBER);
const assertLicenceNumber = licenceNumber => Joi.assert(licenceNumber, VALID_LICENCE_NUMBER);
const assertId = id => Joi.assert(id, VALID_GUID);
const assertNullableString = value => Joi.assert(value, VALID_NULLABLE_STRING);
const assertIsBoolean = value => Joi.assert(value, Joi.boolean().required());
const assertDate = date => Joi.assert(date, VALID_DATE);
const assertNullableDate = date => Joi.assert(date, VALID_DATE.allow(null));
const assertEnum = (str, values) => Joi.assert(str, Joi.string().valid(values).required());

exports.assertIsBoolean = assertIsBoolean;
exports.assertIsInstanceOf = assertIsInstanceOf;
exports.assertIsArrayOfType = assertIsArrayOfType;
exports.assertAccountNumber = assertAccountNumber;
exports.assertLicenceNumber = assertLicenceNumber;
exports.assertId = assertId;
exports.assertNullableString = assertNullableString;
exports.assertDate = assertDate;
exports.assertNullableDate = assertNullableDate;
exports.assertEnum = assertEnum;
