'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const ReturnRequirement = require('../../../../src/lib/connectors/bookshelf/ReturnRequirement');

experiment('lib/connectors/bookshelf/ReturnRequirement.js', () => {
  let instance;

  beforeEach(async () => {
    instance = ReturnRequirement.forge();
    sandbox.stub(instance, 'hasMany');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the water.return_requirements table', async () => {
    expect(instance.tableName).to.equal('water.return_requirements');
  });

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('return_requirement_id');
  });

  test('configures timestamps', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated']);
  });

  experiment('the .returnRequirementPurposes() relation', () => {
    beforeEach(async () => {
      instance.returnRequirementPurposes();
    });

    test('is a function', async () => {
      expect(instance.returnRequirementPurposes).to.be.a.function();
    });

    test('calls .hasMany with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasMany.lastCall.args;
      expect(model).to.equal('ReturnRequirementPurpose');
      expect(foreignKey).to.equal('return_requirement_id');
      expect(foreignKeyTarget).to.equal('return_requirement_id');
    });
  });
});
