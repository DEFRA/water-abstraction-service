const { expect } = require('@hapi/code');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const makeArray = require('../../src/lib/make-array.js');

experiment('lib/make-array', () => {
  test('when the argument is an array, the result is the array', async () => {
    const result = makeArray([1, 2]);
    expect(result).to.equal([1, 2]);
  });

  test('when the argument is not an array, it is converted to an array with one element', async () => {
    const result = makeArray(5);
    expect(result).to.equal([5]);
  });
});
