const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const ChargeAgreementRepository = require('../../../../src/lib/connectors/repository/ChargeAgreementRepository');

const repo = new ChargeAgreementRepository();

const chargeVersionId = 'version_1';

const chargeAgreements = [{
  charge_agreement_id: 'agreement_1'
}, {
  charge_agreement_id: 'agreement_2'
}];

experiment('lib/connectors/repository/ChargeAgreementRepository.js', () => {
  beforeEach(async () => {
    sandbox.stub(ChargeAgreementRepository.prototype, 'dbQuery');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByChargeVersionId', () => {
    let result;

    beforeEach(async () => {
      ChargeAgreementRepository.prototype.dbQuery.resolves({
        rows: chargeAgreements
      });
      result = await repo.findByChargeVersionId(chargeVersionId);
    });

    test('calls this.dbQuery with the correct params', async () => {
      const [query, params] = ChargeAgreementRepository.prototype.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal([chargeVersionId]);
    });

    test('resolves with charge agreements data', async () => {
      expect(result).to.equal(chargeAgreements);
    });
  });
});
