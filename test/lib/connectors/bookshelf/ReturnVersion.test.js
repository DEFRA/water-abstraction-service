'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const ReturnVersion = require('../../../../src/lib/connectors/bookshelf/ReturnVersion');

experiment('lib/connectors/bookshelf/ReturnVersion.js', () => {
  let instance;

  beforeEach(async () => {
    instance = ReturnVersion.forge();
    sandbox.stub(instance, 'hasMany');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the water.return_versions table', async () => {
    expect(instance.tableName).to.equal('water.return_versions');
  });

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('return_version_id');
  });

  test('configures timestamps', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated']);
  });

  experiment('the .returnRequirements() relation', () => {
    beforeEach(async () => {
      instance.returnRequirements();
    });

    test('is a function', async () => {
      expect(instance.returnRequirements).to.be.a.function();
    });

    test('calls .hasMany with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasMany.lastCall.args;
      expect(model).to.equal('ReturnRequirement');
      expect(foreignKey).to.equal('return_version_id');
      expect(foreignKeyTarget).to.equal('return_version_id');
    });
  });
});
