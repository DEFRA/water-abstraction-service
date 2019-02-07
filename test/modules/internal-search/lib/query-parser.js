const Lab = require('lab');
const { experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');

const { parseQuery } = require('../../../../src/modules/internal-search/lib/query-parser');

experiment('queryParser:', () => {
  test('It should detect a numeric search term that is only consists of digits 0-9', async () => {
    expect(parseQuery('0123456789')).to.equal({
      isNumeric: true,
      isUser: false,
      isReturnId: false
    });
  });

  test('It should detect a search term that is for a user account - i.e. contains @ symbol', async () => {
    expect(parseQuery('0123@domain.com')).to.equal({
      isNumeric: false,
      isUser: true,
      isReturnId: false
    });
  });

  test('It should set no flags for a normal licence number search', async () => {
    expect(parseQuery('01/1234/56/*G/R01/123')).to.equal({
      isNumeric: false,
      isUser: false,
      isReturnId: false
    });
  });

  test('It should detect a return ID search', async () => {
    expect(parseQuery('v1:1:01/123/456/*G/R01:1234567890:2017-11-01:2018-10-31')).to.equal({
      isNumeric: false,
      isUser: false,
      isReturnId: true
    });
  });
});
