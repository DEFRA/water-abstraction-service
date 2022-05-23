'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const ChargeElement = require('../../../../src/lib/connectors/bookshelf/ChargeElement');

experiment('lib/connectors/bookshelf/ChargeElement', () => {
  let instance;

  beforeEach(async () => {
    instance = ChargeElement.forge();
    sandbox.stub(instance, 'belongsTo');
    sandbox.stub(instance, 'hasMany');
    sandbox.stub(instance, 'hasOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the water.charge_elements table', async () => {
    expect(instance.tableName).to.equal('water.charge_elements');
  });

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated']);
  });

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('id');
  });

  experiment('the .chargePurposes() relation', () => {
    beforeEach(async () => {
      instance.chargePurposes();
    });

    test('is a function', async () => {
      expect(instance.chargePurposes).to.be.a.function();
    });

    test('calls .hasMany with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasMany.lastCall.args;
      expect(model).to.equal('ChargePurpose');
      expect(foreignKey).to.equal('charge_element_id');
      expect(foreignKeyTarget).to.equal('charge_element_id');
    });
  });
});
