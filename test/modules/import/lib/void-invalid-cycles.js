const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const {
  getFilter,
  processReturnsAsync
} = require('../../../../src/modules/import/lib/void-invalid-cycles');

experiment('getFilter', () => {
  const licenceRef = '01/234/567';
  const returnIds = ['v1:123/456', 'v2:789/123'];

  test('returns a filter object when there are valid return IDs', async () => {
    const filter = getFilter(licenceRef, returnIds);
    expect(filter).to.equal({ regime: 'water',
      licence_type: 'abstraction',
      licence_ref: '01/234/567',
      source: 'NALD',
      return_id: { '$nin': [ 'v1:123/456', 'v2:789/123' ] } });
  });

  test('returns a filter object when there are no valid return IDs', async () => {
    const filter = getFilter(licenceRef, []);
    expect(filter).to.equal({ regime: 'water',
      licence_type: 'abstraction',
      licence_ref: '01/234/567',
      source: 'NALD' });
  });
});

experiment('processReturnsAsync', () => {
  const returns = [{
    return_id: 123
  }, {
    return_id: 456
  }];

  const func = async (returnId) => {
    return returnId + 1;
  };

  test('returns a filter object when there are valid return IDs', async () => {
    const result = await processReturnsAsync(returns, func);
    expect(result).to.equal([ 124, 457 ]);
  });
});
