const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const billingVolumes = require('../../../../src/lib/connectors/repos/billing-volumes');
const { BillingVolume } = require('../../../../src/lib/connectors/bookshelf');

experiment('lib/connectors/repos/billing-volumes', () => {
  let stub, model;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      save: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      fetch: sandbox.stub().resolves(model)
    };
    sandbox.stub(BillingVolume, 'forge').returns(stub);
  });

  afterEach(async () => sandbox.restore());

  experiment('.create', () => {
    let result;

    const data = {
      chargeElementId: '82edd393-c53b-4ea9-bd51-f56cc065777e',
      financialYear: 2019,
      isSummer: false
    };

    beforeEach(async () => {
      result = await billingVolumes.create(data);
    });

    test('calls model.forge with correct data', async () => {
      const [params] = BillingVolume.forge.lastCall.args;
      expect(params).to.equal(data);
    });

    test('.save() on the model', async () => {
      expect(stub.save.called).to.be.true();
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.findByChargeElementId', () => {
    let result;
    const id = 'charge-element-id';

    beforeEach(async () => {
      result = await billingVolumes.findByChargeElementId(id);
    });

    test('calls model.forge', () => {
      expect(BillingVolume.forge.called).to.be.true();
    });

    test('queries for matching charge element id', async () => {
      const [filter] = stub.where.lastCall.args;
      expect(filter).to.equal({ charge_element_id: id });
    });

    test('calls fetch with expected option', () => {
      const [option] = stub.fetch.lastCall.args;
      expect(option).to.equal({ require: false });
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });

  experiment('.update', () => {
    let result;
    const id = 'test-id';
    const changes = {
      isApproved: true,
      twoPartTariffReview: { id: 1234, email: 'test@example.com' }
    };
    beforeEach(async () => {
      result = await billingVolumes.update(id, changes);
    });

    test('calls model.forge with correct data', () => {
      const [params] = BillingVolume.forge.lastCall.args;
      expect(params.billingEventId).to.equal(id);
    });

    test('calls save with correct data', () => {
      const [params] = stub.save.lastCall.args;
      expect(params).to.equal(changes);
    });

    test('calls toJSON() on returned models', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ foo: 'bar' });
    });
  });
});
