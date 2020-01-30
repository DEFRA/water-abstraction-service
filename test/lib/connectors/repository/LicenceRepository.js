const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const LicenceRepository = require('../../../../src/lib/connectors/repository/LicenceRepository');

const repo = new LicenceRepository();

const data = {
  licenceNumber: '01/123/ABC',
  singleRow: [{
    licence_id: 'f5d78402-8dc4-490a-8326-b1be90e12729',
    region_id: '11131a93-0f5c-477a-a68a-91f55f4c48f9',
    licence_ref: '01/123/ABC',
    include_in_supplementary_billing: false
  }]
};

experiment('lib/connectors/repository/LicenceRepository', () => {
  beforeEach(async () => {
    sandbox.stub(LicenceRepository.prototype, 'find');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOneByLicenceNumber', () => {
    let result;

    beforeEach(async () => {
      LicenceRepository.prototype.find.resolves({
        rows: data.singleRow
      });
      result = await repo.findOneByLicenceNumber(data.licenceNumber);
    });

    test('calls this.find with appropriate filter', async () => {
      expect(LicenceRepository.prototype.find.calledWith({
        licence_ref: data.licenceNumber
      })).to.be.true();
    });

    test('resolves with first row found', async () => {
      expect(result).to.equal(data.singleRow[0]);
    });
  });
});
