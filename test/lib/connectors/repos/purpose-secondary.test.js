const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const purposeSecondary = require('../../../../src/lib/connectors/repos/purpose-secondary');
const { PurposeSecondary } = require('../../../../src/lib/connectors/bookshelf');
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers');

experiment('lib/connectors/repos/purpose-secondary', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne').resolves({});
    sandbox.stub(helpers, 'create').resolves({});
  });

  afterEach(async () => sandbox.restore());

  experiment('.findOneByLegacyId', () => {
    beforeEach(async () => {
      await purposeSecondary.findOneByLegacyId('legacy-id');
    });

    test('calls helpers .findOne() with the correct params', async () => {
      const [model, idKey, id] = helpers.findOne.lastCall.args;
      expect(model).to.equal(PurposeSecondary);
      expect(idKey).to.equal('legacyId');
      expect(id).to.equal('legacy-id');
    });
  });
  experiment('.create', () => {
    const data = { legacyId: 'legacy-id' };
    beforeEach(async () => {
      await purposeSecondary.create(data);
    });

    test('calls helpers .create() with the correct params', async () => {
      const [bookShelfModel, createdData] = helpers.create.lastCall.args;
      expect(bookShelfModel).to.equal(PurposeSecondary);
      expect(createdData).to.equal(data);
    });
  });
});
