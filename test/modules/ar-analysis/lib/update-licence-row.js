const Lab = require('lab');
const { experiment, test, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');

const {
  getPermitFilter,
  getLicence
} = require('../../../../src/modules/ar-analysis/lib/update-licence-row');

const permit = require('../../../../src/lib/connectors/permit');

const config = {
  regimeId: 1,
  typeId: 8
};

const licenceRef = '01/123';

experiment('getPermitFilter', () => {
  test('It should format a filter object for the permit repository', async () => {
    const result = getPermitFilter(licenceRef, config);
    expect(result).to.equal({
      licence_regime_id: config.regimeId,
      licence_type_id: config.typeId,
      licence_ref: licenceRef
    });
  });
});

experiment('getLicence', () => {
  let stub;

  afterEach(async () => {
    stub.restore();
  });

  test('It should reject if an API error object returned', async () => {
    stub = sinon.stub(permit.licences, 'findMany').resolves({
      error: {
        name: 'DBError',
        message: 'Some error'
      }
    });

    const func = async () => {
      return getLicence(licenceRef, config);
    };
    expect(func()).to.reject();
  });

  test('It should reject if no licence found', async () => {
    stub = sinon.stub(permit.licences, 'findMany').resolves({ error: null, data: [] });

    const func = async () => {
      return getLicence(licenceRef, config);
    };
    expect(func()).to.reject();
  });

  test('It should resolve with data if licence found', async () => {
    const row = { licence_ref: licenceRef };

    stub = sinon.stub(permit.licences, 'findMany').resolves({ error: null, data: [row] });

    const result = await getLicence(licenceRef, config);
    expect(result).to.equal(row);
  });
});
