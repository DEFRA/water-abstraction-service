const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const purposeUses = require('../../../../src/lib/connectors/repos/purpose-uses');
const { PurposeUse } = require('../../../../src/lib/connectors/bookshelf');

experiment('lib/connectors/repos/purpose-uses', () => {
  let stub, model;

  beforeEach(async () => {
    model = {
      toJSON: sandbox.stub().returns({ foo: 'bar' })
    };

    stub = {
      save: sandbox.stub().resolves(model),
      where: sandbox.stub().returnsThis(),
      query: sandbox.stub().returnsThis(),
      fetch: sandbox.stub().resolves(model),
      fetchAll: sandbox.stub().resolves(model),
      destroy: sandbox.stub().resolves()
    };

    sandbox.stub(PurposeUse, 'where').returns(stub);
  });

  afterEach(async () => sandbox.restore());

  experiment('.findByCodes', () => {
    beforeEach(async () => {
      await purposeUses.findByCodes(['400', '401']);
    });

    test('calls model.where to find all with legacy ID matching supplied codes', async () => {
      expect(PurposeUse.where.calledWith(
        'legacy_id', 'in', ['400', '401']
      )).to.be.true();
    });

    test('calls .fetchAll() on the model', async () => {
      expect(stub.fetchAll.called).to.be.true();
    });

    test('calls toJSON() on returned collection', async () => {
      expect(model.toJSON.callCount).to.equal(1);
    });
  });
});
