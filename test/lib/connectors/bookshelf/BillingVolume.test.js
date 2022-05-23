'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const BillingVolume = require('../../../../src/lib/connectors/bookshelf/BillingVolume');

experiment('lib/connectors/bookshelf/BillingVolume', () => {
  let instance;

  beforeEach(async () => {
    instance = BillingVolume.forge();
    sandbox.stub(instance, 'belongsTo');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the water.billing_volumes table', async () => {
    expect(instance.tableName).to.equal('water.billing_volumes');
  });

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('billing_volume_id');
  });

  experiment('the .billingBatch() relation', () => {
    beforeEach(async () => {
      instance.billingBatch();
    });

    test('is a function', async () => {
      expect(instance.billingBatch).to.be.a.function();
    });

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.belongsTo.lastCall.args;
      expect(model).to.equal('BillingBatch');
      expect(foreignKey).to.equal('billing_batch_id');
      expect(foreignKeyTarget).to.equal('billing_batch_id');
    });
  });

  experiment('the .chargeElement() relation', () => {
    beforeEach(async () => {
      instance.chargeElement();
    });

    test('is a function', async () => {
      expect(instance.chargeElement).to.be.a.function();
    });

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.belongsTo.lastCall.args;
      expect(model).to.equal('ChargeElement');
      expect(foreignKey).to.equal('charge_element_id');
      expect(foreignKeyTarget).to.equal('charge_element_id');
    });
  });
});
