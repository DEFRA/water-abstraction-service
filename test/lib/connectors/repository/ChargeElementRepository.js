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
    sandbox.stub(ChargeElementRepository.prototype, 'find');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByChargeVersionId', () => {
    let result;

    beforeEach(async () => {
      ChargeElementRepository.prototype.find.resolves({
        rows: chargeElements
      });
      result = await repo.findByChargeVersionId(chargeVersionId);
    });

    test('filters charge elements by the supplied charge version ID', async () => {
      const [filter] = ChargeElementRepository.prototype.find.lastCall.args;
      expect(filter).to.equal({
        charge_version_id: chargeVersionId
      });
    });

    test('sorts charge elements time limited dates', async () => {
      const [, sort] = ChargeElementRepository.prototype.find.lastCall.args;
      expect(sort).to.equal({
        time_limited_start_date: +1,
        time_limited_end_date: +1
      });
    });

    test('resolves with charge elements data', async () => {
      expect(result).to.equal(chargeElements);
    });
  });
});
