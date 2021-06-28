const { expect } = require('@hapi/code');
const {
  experiment,
  beforeEach,
  afterEach,
  before,
  test
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { v4: uuid } = require('uuid');

const gaugingStationsRepo = require('../../../src/lib/connectors/repos/gauging-stations');
const gaugingStationService = require('../../../src/lib/services/gauging-station-service');
const licenceGaugingStationsService = require('../../../src/lib/services/licence-gauging-stations-service');
const licencesService = require('../../../src/lib/services/licences');
const controller = require('../../../src/modules/gauging-stations/controller');
const controllerHelper = require('../../../src/lib/controller');

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

experiment('getGaugingStationByRef', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(controllerHelper, 'getEntities').resolves();
    sandbox.stub(gaugingStationsRepo, 'findOneByStationRef').resolves('some station');
    result = controller.getGaugingStationByRef({
      params: {
        stationRef: 'someRef'
      }
    });
  });

  afterEach(() => sandbox.restore());

  test('it calls the getEntities helper', () => {
    expect(controllerHelper.getEntities.called).to.be.true();
    expect(result);
  });
});

experiment('getGaugingStationLicencesById', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(controllerHelper, 'getEntities').resolves();
    sandbox.stub(gaugingStationsRepo, 'findLicenceConditionsByStationId').resolves('some station');
    result = controller.getGaugingStationLicencesById({
      params: {
        gaugingStationId: 'guid goes here'
      }
    });
  });

  afterEach(() => sandbox.restore());

  test('it calls the getEntities helper', () => {
    expect(controllerHelper.getEntities.called).to.be.true();
    expect(result);
  });
});

experiment('createLicenceGaugingStationLink', () => {
  const request = {
    params: {
      gaugingStationId: '00000000-0000-0000-0000-000000000000'
    },
    payload: {
      licenceId: '00000000-0000-0000-0000-000000000001',
      licenceVersionPurposeConditionId: '00000000-0000-0000-0000-000000000002',
      thresholdUnit: 'm',
      thresholdValue: 10,
      abstractionPeriod: {
        startDay: null,
        startMonth: null,
        endDay: null,
        endMonth: null
      },
      restrictionType: 'flow',
      alertType: 'reduce'
    }
  };
  beforeEach(async () => {
    await sandbox.stub(licencesService, 'getLicenceById').resolves({ id: '00000000-0000-0000-0000-000000000000' });
    await sandbox.stub(gaugingStationService, 'getGaugingStation').resolves({ id: '00000000-0000-0000-0000-000000000001' });
    await sandbox.stub(licenceGaugingStationsService, 'createNewLicenceLink').resolves();
    await controller.createLicenceGaugingStationLink(request);
  });

  afterEach(() => sandbox.restore());

  test('calls licencesService.getLicenceById to ascertain if the licence exists', () => {
    expect(licencesService.getLicenceById.calledWith('00000000-0000-0000-0000-000000000001')).to.be.true();
  });
  test('calls gaugingStationService.getGaugingStation to ascertain if the station exists', () => {
    expect(gaugingStationService.getGaugingStation.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
  });
});

experiment('deleteLicenceGaugingStationLink', () => {
  const request = {
    params: {
      licenceGaugingStationId: '00000000-0000-0000-0000-000000000000'
    }
  };
  experiment('when given a valid GUID', () => {
    beforeEach(async () => {
      await sandbox.stub(licenceGaugingStationsService, 'getLicenceGaugingStationById').resolves({ id: '00000000-0000-0000-0000-000000000000' });
      await sandbox.stub(licenceGaugingStationsService, 'deleteLicenceLink').resolves();
      await controller.deleteLicenceGaugingStationLink(request);
    });

    afterEach(async () => {
      await sandbox.restore();
    });

    test('calls licenceGaugingStationsService.getLicenceGaugingStationById to ascertain if the linkage exists', () => {
      expect(licenceGaugingStationsService.getLicenceGaugingStationById.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
    });
    test('calls licenceGaugingStationsService.deleteLicenceLink to delete the linkage', () => {
      expect(licenceGaugingStationsService.deleteLicenceLink.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
    });
  });

  experiment('when given an invalid GUID', () => {
    let result;
    beforeEach(async () => {
      await sandbox.stub(licenceGaugingStationsService, 'getLicenceGaugingStationById').returns(null);
      await sandbox.stub(licenceGaugingStationsService, 'deleteLicenceLink').resolves();
      result = await controller.deleteLicenceGaugingStationLink(request);
    });
    afterEach(async () => {
      await sandbox.restore();
    });

    test('calls licenceGaugingStationsService.getLicenceGaugingStationById to ascertain if the linkage exists', () => {
      expect(licenceGaugingStationsService.getLicenceGaugingStationById.calledWith('00000000-0000-0000-0000-000000000000')).to.be.true();
    });
    test('does not call licenceGaugingStationsService.deleteLicenceLink to delete the linkage', () => {
      expect(licenceGaugingStationsService.deleteLicenceLink.called).to.be.false();
      expect(result.isBoom).to.be.true();
      expect(result.output.payload.statusCode).to.equal(404);
    });
  });
});
