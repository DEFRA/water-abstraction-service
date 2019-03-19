const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { logger } = require('@envage/water-abstraction-helpers');
const controller = require('../../../src/modules/ar-analysis/controller');
const updateLicence = require('../../../src/modules/ar-analysis/lib/update-licence-row');

experiment('controller', () => {
  let request;

  beforeEach(async () => {
    sandbox.stub(updateLicence, 'updateLicenceRow');
    sandbox.stub(logger, 'error');

    request = {
      params: { licenceRef: '123' }
    };
  });

  afterEach(async () => sandbox.restore());

  test('returns the update result', async () => {
    const updateRowResult = { test: 'ok' };
    updateLicence.updateLicenceRow.resolves(updateRowResult);
    const response = await controller.getUpdateLicence(request);
    expect(response).to.equal(updateRowResult);
  });

  experiment('when updateLicenceRow errors', () => {
    beforeEach(async () => {
      updateLicence.updateLicenceRow.rejects({ name: 'nasty error' });
    });

    afterEach(async () => sandbox.restore());

    test('the error is logged', async () => {
      try {
        await controller.getUpdateLicence(request);
      } catch (e) {
        const [message, error, params] = logger.error.lastCall.args;
        expect(message).to.equal('Failed to update AR licence');
        expect(error.name).to.equal('nasty error');
        expect(params.licenceRef).to.equal('123');
      }
    });

    test('a 500 error is thrown', async () => {
      try {
        await controller.getUpdateLicence(request);
      } catch (e) {
        expect(e.isBoom).to.be.true();
        expect(e.output.payload.statusCode).to.equal(500);
      }
    });
  });
});
