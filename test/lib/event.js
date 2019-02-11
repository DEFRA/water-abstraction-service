const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();

const Event = require('../../src/lib/event');

experiment('getters and setters', () => {
  test('setType', async () => {
    const evt = new Event();
    evt.setType('type', 'sub-type');
    expect(evt.data.type).to.equal('type');
    expect(evt.data.subtype).to.equal('sub-type');
  });

  test('setIssuer', async () => {
    const evt = new Event();
    evt.setIssuer('issuer');
    expect(evt.data.issuer).to.equal('issuer');
  });

  test('setStatus', async () => {
    const evt = new Event();
    evt.setStatus('status-test');
    expect(evt.data.status).to.equal('status-test');
  });
});
