const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const ChargeElementRepository = require('../../../../src/lib/connectors/repository/ChargeElementRepository');

const repo = new ChargeElementRepository();

const chargeVersionId = 'version_1';

const chargeElements = [{
  charge_element_id: 'element_1'
}, {
  charge_element_id: 'element_2'
}];

experiment('lib/connectors/repository/ChargeElementRepository.js', () => {
  beforeEach(async () => {
    sandbox.stub(ChargeElementRepository.prototype, 'dbQuery');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByChargeVersionId', () => {
    let result;

    beforeEach(async () => {
      ChargeElementRepository.prototype.dbQuery.resolves({
        rows: chargeElements
      });
      result = await repo.findByChargeVersionId(chargeVersionId);
    });

    test('passes the expected params to the query', async () => {
      const [, params] = ChargeElementRepository.prototype.dbQuery.lastCall.args;
      expect(params).to.equal([chargeVersionId]);
    });

    test('resolves with charge elements data', async () => {
      expect(result).to.equal(chargeElements);
    });
  });
});
