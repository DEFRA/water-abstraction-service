const Lab = require('lab');
const lab = Lab.script();
const Code = require('code');

const { getNotifyKey } = require('../../../src/modules/notify/helpers.js');

lab.experiment('Test notify helpers', () => {
  lab.test('The API should get test notify key', async () => {
    Code.expect(getNotifyKey('test')).to.equal(process.env.TEST_NOTIFY_KEY);
  });

  lab.test('The API should get whitelist notify key', async () => {
    Code.expect(getNotifyKey('whitelist')).to.equal(process.env.WHITELIST_NOTIFY_KEY);
  });

  lab.test('The API should get live notify key', async () => {
    Code.expect(getNotifyKey('live')).to.equal(process.env.LIVE_NOTIFY_KEY);
  });

  lab.test('The API should use a custom notify key', async () => {
    Code.expect(getNotifyKey('some-other-key')).to.equal('some-other-key');
  });
});

exports.lab = lab;
