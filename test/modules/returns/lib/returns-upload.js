const { getUploadFilename } = require('../../../../src/modules/returns/lib/returns-upload');

const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

experiment('getUploadFilename', () => {
  test('uses xml extension by default', async () => {
    const filename = getUploadFilename('test-id');
    expect(filename).to.equal('returns-upload/test-id.xml');
  });

  test('uses xml extension by default', async () => {
    const filename = getUploadFilename('test-id', 'json');
    expect(filename).to.equal('returns-upload/test-id.json');
  });
});
