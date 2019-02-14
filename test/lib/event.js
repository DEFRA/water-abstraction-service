const { expect } = require('code');
const {
  experiment,
  test
} = exports.lab = require('lab').script();

const Event = require('../../src/lib/event');

experiment('getters and setters', () => {
  test('setType', async () => {
    const evt = new Event();
    expect(evt.setType('type', 'sub-type')).to.shallow.equal(evt);
    expect(evt.data.type).to.equal('type');
    expect(evt.data.subtype).to.equal('sub-type');
  });

  test('setIssuer', async () => {
    const evt = new Event();
    expect(evt.setIssuer('issuer')).to.shallow.equal(evt);
    expect(evt.data.issuer).to.equal('issuer');
  });

  test('setStatus', async () => {
    const evt = new Event();
    expect(evt.setStatus('status-test')).to.shallow.equal(evt);
    expect(evt.data.status).to.equal('status-test');
  });

  test('setComment', async () => {
    const evt = new Event();
    expect(evt.setComment('comment-test')).to.shallow.equal(evt);
    expect(evt.data.comment).to.equal('comment-test');
  });
});
