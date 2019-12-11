const { isArray } = require('lodash');
const { assert } = require('@hapi/hoek');

const isArrayOfType = (values, type) => {
  assert(isArray(values), 'Array expected');
  values.forEach((value, i) =>
    assert(value instanceof type, `${type.constructor.name} expected at position ${i}`)
  );
};

exports.isArrayOfType = isArrayOfType;
