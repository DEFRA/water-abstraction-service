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
const chargeElementId = 'element_1';

const chargeElements = [{
  charge_element_id: 'element_1'
}, {
  charge_element_id: 'element_2'
}];

experiment('lib/connectors/repository/ChargeElementRepository.js', () => {
  beforeEach(async () => {
    sandbox.stub(ChargeElementRepository.prototype, 'dbQuery');
    sandbox.stub(ChargeElementRepository.prototype, 'find');
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

  experiment('.findOneById', () => {
    let result;

    experiment('when a charge element is found', () => {
      beforeEach(async () => {
        ChargeElementRepository.prototype.find.resolves({
          rows: chargeElements.slice(0, 1)
        });
        result = await repo.findOneById(chargeElementId);
      });

      test('passes the expected filter to .find()', async () => {
        const [filter] = ChargeElementRepository.prototype.find.lastCall.args;
        expect(filter).to.equal({ charge_element_id: chargeElementId });
      });

      test('resolves with charge element data', async () => {
        expect(result).to.equal(chargeElements[0]);
      });
    });

    experiment('when a charge element is not found', () => {
      beforeEach(async () => {
        ChargeElementRepository.prototype.find.resolves({
          rows: []
        });
        result = await repo.findOneById(chargeVersionId);
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});
