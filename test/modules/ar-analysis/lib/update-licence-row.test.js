const Lab = require('@hapi/lab');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');

const {
  getPermitFilter,
  getLicence,
  updateLicenceRow
} = require('../../../../src/modules/ar-analysis/lib/update-licence-row');

const permit = require('../../../../src/lib/connectors/permit');
const arAnalysisController = require('../../../../src/controllers/ar-analysis-licences.js');

const permitResponse = require('../../../responses/permits/licence');

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

experiment('updateLicenceRow', () => {
  beforeEach(async () => {
    sinon.stub(permit.licences, 'findMany');

    sinon.stub(arAnalysisController.repository, 'create')
      .resolves({
        rowCount: 1,
        rows: [{
          licence_ref: '123',
          status: 'In progress'
        }]
      });
  });

  afterEach(async () => {
    permit.licences.findMany.restore();
    arAnalysisController.repository.create.restore();
  });

  experiment('when the abstraction reform has no actions', () => {
    beforeEach(async () => {
      permit.licences.findMany
        .onCall(0).resolves(permitResponse.emptyAbstractionReform())
        .onCall(1).resolves(permitResponse.licences());
    });

    test('no analysis row is created', async () => {
      await updateLicenceRow('123');
      expect(arAnalysisController.repository.create.called).to.be.false();
    });

    test('a no action object is returned', async () => {
      const result = await updateLicenceRow('123');
      expect(result).to.be.equal({
        error: null,
        data: 'No AR for licence yet',
        licenceRef: '123'
      });
    });
  });

  experiment('when the abstraction reform has actions', () => {
    beforeEach(async () => {
      permit.licences.findMany
        .onCall(0).resolves(permitResponse.abstractionReformLicence())
        .onCall(1).resolves(permitResponse.licences());
    });

    test('an analysis row is created', async () => {
      await updateLicenceRow('123');
      expect(arAnalysisController.repository.create.called).to.be.true();
    });

    test('the analysis row is returned', async () => {
      const result = await updateLicenceRow('123');
      expect(result.licence_ref).to.equal('123');
      expect(result.status).to.equal('In progress');
    });
  });
});
