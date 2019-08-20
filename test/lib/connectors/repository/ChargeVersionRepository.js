const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const ChargeVersionRepository = require('../../../../src/lib/connectors/repository/ChargeVersionRepository');

const repo = new ChargeVersionRepository();

const chargeVersions = [{
  charge_version_id: 'version_1'
}, {
  charge_version_id: 'version_2'
}];

experiment('lib/connectors/repository/ChargeVersionRepository.js', () => {
  beforeEach(async () => {
    sandbox.stub(ChargeVersionRepository.prototype, 'find');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByLicenceRef', () => {
    let result;
    const licenceRef = '01/123';

    beforeEach(async () => {
      ChargeVersionRepository.prototype.find.resolves({
        rows: chargeVersions
      });
      result = await repo.findByLicenceRef(licenceRef);
    });

    test('filters charge versions by licence number', async () => {
      const [filter] = ChargeVersionRepository.prototype.find.lastCall.args;
      expect(filter).to.equal({
        licence_ref: licenceRef
      });
    });

    test('sorts charge versions by start date', async () => {
      const [, sort] = ChargeVersionRepository.prototype.find.lastCall.args;
      expect(sort).to.equal({
        start_date: +1
      });
    });

    test('resolves with charge versions', async () => {
      expect(result).to.equal(chargeVersions);
    });
  });

  experiment('.findOneById', () => {
    let result;
    const chargeVersionId = 'version_1';

    beforeEach(async () => {
      ChargeVersionRepository.prototype.find.resolves({
        rows: [chargeVersions[0]]
      });
      result = await repo.findOneById(chargeVersionId);
    });

    test('filters charge versions by charge version ID', async () => {
      const [filter] = ChargeVersionRepository.prototype.find.lastCall.args;
      expect(filter).to.equal({
        charge_version_id: chargeVersionId
      });
    });

    test('resolves with charge version', async () => {
      expect(result).to.equal(chargeVersions[0]);
    });
  });
});
