const { expect } = require('@hapi/code');
const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { v4: uuid } = require('uuid');

const gaugingStationsRepo = require('../../../src/lib/connectors/repos/gauging-stations');
const controllers = require('../../../src/modules/gauging-stations/controllers');

experiment('.getGaugingStation', () => {
  const tempGuid = uuid();
  beforeEach(async () => {
    sandbox.stub(gaugingStationsRepo, 'findOne').resolves('some station');
    await controllers.getGaugingStation({
      params: {
        stationGuid: tempGuid
      }
    });
  });

  afterEach(() => sandbox.restore());

  test('it calls the gauging stations repo findOne method', () => {
    expect(gaugingStationsRepo.findOne.calledWith(tempGuid)).to.be.true();
  });
});
