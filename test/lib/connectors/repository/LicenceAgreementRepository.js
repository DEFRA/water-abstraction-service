const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const LicenceAgreementRepository = require('../../../../src/lib/connectors/repository/LicenceAgreementRepository');

const repo = new LicenceAgreementRepository();

const data = {
  licenceNumber: '01/123/ABC',
  agreementCodes: ['S127', 'S130S'],
  singleRow: [{
    licence_agreement_id: 'f5d78402-8dc4-490a-8326-b1be90e12729',
    licence_ref: '01/123/ABC',
    financial_agreement_type_id: 'S127',
    start_date: '2019-06-01',
    end_date: null
  }]
};

experiment('lib/connectors/repository/LicenceAgreementRepository', () => {
  beforeEach(async () => {
    sandbox.stub(LicenceAgreementRepository.prototype, 'find');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByLicenceNumber', () => {
    let result;

    beforeEach(async () => {
      LicenceAgreementRepository.prototype.find.resolves({
        rows: data.singleRow
      });
    });

    experiment('when financial agreement codes are not supplied', () => {
      beforeEach(async () => {
        result = await repo.findByLicenceNumber(data.licenceNumber);
      });

      test('calls prototype.find with appropriate filter', async () => {
        const filter = LicenceAgreementRepository.prototype.find.lastCall.args[0];
        expect(filter).to.equal({
          licence_ref: data.licenceNumber
        });
      });

      test('resolves with list of agreements', async () => {
        expect(result).to.equal(data.singleRow);
      });
    });

    experiment('when financial agreement codes are supplied', () => {
      beforeEach(async () => {
        result = await repo.findByLicenceNumber(data.licenceNumber, data.agreementCodes);
      });

      test('calls prototype.find with appropriate filter', async () => {
        const filter = LicenceAgreementRepository.prototype.find.lastCall.args[0];
        expect(filter).to.equal({
          licence_ref: data.licenceNumber,
          financial_agreement_type_id: {
            $in: data.agreementCodes
          }
        });
      });

      test('resolves with list of agreements', async () => {
        expect(result).to.equal(data.singleRow);
      });
    });
  });
});
