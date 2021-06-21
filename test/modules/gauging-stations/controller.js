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
const controller = require('../../../src/modules/gauging-stations/controller');
const gaugingStationService = require('../../../src/lib/services/gauging-station-service');
const entitiesController = require('../../../src/lib/controller');

experiment('.getGaugingStation', () => {
  const tempGuid = uuid();

  experiment('with a valid guid', () => {
    beforeEach(async () => {
      sandbox.stub(gaugingStationsRepo, 'findOne').resolves('some station');
      await controller.getGaugingStation({
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

  experiment('with an invalid guid', () => {
    let result;
    beforeEach(async () => {
      sandbox.stub(gaugingStationsRepo, 'findOne').resolves(null);
      result = await controller.getGaugingStation({
        params: {
          stationGuid: tempGuid
        }
      });
    });

    afterEach(() => sandbox.restore());

    test('it calls the gauging stations repo findOne method', () => {
      expect(gaugingStationsRepo.findOne.calledWith(tempGuid)).to.be.true();
    });
    test('it returns a Boom error', () => {
      expect(result.isBoom).to.be.true();
      expect(result.output.statusCode).to.equal(404);
      expect(result.output.payload.message).to.equal(`Gauging station ${tempGuid} not found`);
    });
  });
});

experiment('.getGaugingStationbyRef', () => {
  beforeEach(() => {
    sandbox.stub(entitiesController, 'getEntities').resolves();
  });

  afterEach(() => sandbox.restore());

  const request = {
    params: {
      stationRef: 'some-ref'
    }
  };

  test('calls getEntities', async () => {
    await controller.getGaugingStationByRef(request);
    expect(entitiesController.getEntities.calledWith(request.params.stationRef, gaugingStationService.getGaugingStationsByRef));
  });
});

experiment('.getGaugingStationLicencesById', () => {
  beforeEach(() => {
    sandbox.stub(entitiesController, 'getEntities').resolves();
  });

  afterEach(() => sandbox.restore());

  const request = {
    params: {
      gaugingStationId: 'some-guid'
    }
  };

  test('calls getEntities', async () => {
    await controller.getGaugingStationLicencesById(request);
    expect(entitiesController.getEntities.calledWith(request.params.gaugingStationId, gaugingStationService.getGaugingStationLicencesById));
  });
});
