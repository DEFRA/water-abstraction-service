const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const entityConnector = require('../../../../src/lib/connectors/crm/entities');
const entities = require('../../../../src/modules/acceptance-tests/lib/entities');

experiment('modules/acceptance-tests/lib/entities', () => {
  beforeEach(async () => {
    sandbox.stub(entityConnector, 'createEntity').resolves();
    sandbox.stub(entityConnector, 'createEntityRole').resolves();
    sandbox.stub(entityConnector, 'deleteAcceptanceTestData').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createIndividual', () => {
    beforeEach(async () => {
      await entities.createIndividual('test-email');
    });

    test('uses the email to create the entity', async () => {
      const [email] = entityConnector.createEntity.lastCall.args;
      expect(email).to.equal('test-email');
    });

    test('create an "individual" entity', async () => {
      const [, type] = entityConnector.createEntity.lastCall.args;
      expect(type).to.equal('individual');
    });

    test('uses the test "source" so the entity can be easily deleted', async () => {
      const [, , source] = entityConnector.createEntity.lastCall.args;
      expect(source).to.equal('acceptance-test-setup');
    });
  });

  experiment('.createV1Company', () => {
    beforeEach(async () => {
      await entities.createV1Company();
    });

    test('uses the test compnay name to create the entity', async () => {
      const [email] = entityConnector.createEntity.lastCall.args;
      expect(email).to.equal('acceptance-test-company');
    });

    test('creates an "company"" entity', async () => {
      const [, type] = entityConnector.createEntity.lastCall.args;
      expect(type).to.equal('company');
    });

    test('uses the test "source" so the entity can be easily deleted', async () => {
      const [, , source] = entityConnector.createEntity.lastCall.args;
      expect(source).to.equal('acceptance-test-setup');
    });
  });

  experiment('.createEntityRole', () => {
    beforeEach(async () => {
      await entities.createEntityRole('ent-id', 'comp-id', 'test-role');
    });

    test('passes the data including the source', async () => {
      const [entityId, role, source, companyId] = entityConnector.createEntityRole.lastCall.args;
      expect(entityId).to.equal('ent-id');
      expect(role).to.equal('test-role');
      expect(source).to.equal('acceptance-test-setup');
      expect(companyId).to.equal('comp-id');
    });
  });
});
