'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

const licenceVersionsRepo = require('../../../../src/lib/connectors/repos/licence-versions');
const LicenceVersion = require('../../../../src/lib/connectors/bookshelf/LicenceVersion');

experiment('lib/connectors/repos/licence-versions', () => {
  let stub;
  let result;

  beforeEach(async () => {
    stub = {
      fetchAll: sandbox.stub().resolves({
        toJSON: () => ([
          { licenceVersionId: 'ver-1' },
          { licenceVersionId: 'ver-2' }
        ])
      }),
      where: sandbox.stub().returnsThis()
    };
    sandbox.stub(LicenceVersion, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByLicenceId', () => {
    beforeEach(async () => {
      result = await licenceVersionsRepo.findByLicenceId('test-licence-id');
    });

    test('queries by licence id', async () => {
      const [field, id] = stub.where.lastCall.args;
      expect(field).to.equal('licence_id');
      expect(id).to.equal('test-licence-id');
    });

    test('calls .fetchAll() to retrieve all matching records', async () => {
      expect(stub.fetchAll.called).to.be.true();
    });

    test('resolves with the results', async () => {
      expect(result).to.equal([
        { licenceVersionId: 'ver-1' },
        { licenceVersionId: 'ver-2' }
      ]);
    });
  });
});
