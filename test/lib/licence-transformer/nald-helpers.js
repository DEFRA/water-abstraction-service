const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const naldHelpers = require('../../../src/lib/licence-transformer/nald-helpers');

experiment('createUniqueId', () => {
  test('creates the expected string', async () => {
    const id = 1;
    const regionCode = 8;
    const type = 'points';

    const result = naldHelpers.createUniqueId(type, regionCode, id);
    expect(result).to.equal('nald://points/8/1');
  });
});

experiment('parseUniqueId', () => {
  test('the id is extracted', async () => {
    const input = 'nald://conditions/8/123';
    const id = naldHelpers.parseUniqueId(input).id;
    expect(id).to.equal('123');
  });

  test('can handle ids that contain slashes', async () => {
    const input = 'nald://licences/8/123/S*/45/6789';
    const id = naldHelpers.parseUniqueId(input).id;
    expect(id).to.equal('123/S*/45/6789');
  });

  test('the regionCode is extracted', async () => {
    const input = 'nald://points/2/123';
    const id = naldHelpers.parseUniqueId(input).regionCode;
    expect(id).to.equal('2');
  });

  test('the type is extracted', async () => {
    const input = 'nald://conditions/8/123';
    const id = naldHelpers.parseUniqueId(input).type;
    expect(id).to.equal('conditions');
  });
});
