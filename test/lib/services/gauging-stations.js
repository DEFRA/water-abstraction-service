'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();
const gaugingStationService = require('../../../src/lib/services/gauging-station-service');
const repos = require('../../../src/lib/connectors/repos');
const gaugingStationRepo = require('../../../src/lib/connectors/repos/gauging-stations');

const routes = require('../../../src/modules/gauging-stations/routes');
const testHelpers = require('../../test-helpers');
/* const gaugingStation = require('../../../src/lib/models/gauging-station');
const { ROLES } = require('../../../src/lib/roles'); */

const data = {
  dbRow: {
    gaugingStationId: '09eefc79-f14a-4a01-bad9-220be046946f',
    stationReference: 'E22231'
  }
};

experiment('getGaugingStationConditionsForId', () => {
  let result;
  beforeEach(async () => {
    sandbox.stub(repos.gaugingStations, 'findStationConditionsForId'); /* simulate db results */
    gaugingStationRepo.findStationConditionsForId.resolves(data.dbRow);
    result = await gaugingStationService.getGaugingStationConditionsForId(data.dbRow.gaugingStationId);
  });
  afterEach(async () => {
    sandbox.restore(); /* e.g. searchGaugingstations require restore */
  });
  test('calls repos.gaugingStation.getGaugingStationConditionsForId with id', async () => {
    const [id] = gaugingStationRepo.findStationConditionsForId.lastCall.args;
    expect(Array.isArray(result)).to.equal(false);
    expect(id).to.equal(data.dbRow.gaugingStationId);
  });
});

experiment('calls gaugingStation Api with id', () => {
  let server, request;
  beforeEach(async () => {
    server = await testHelpers.createServerForRoute(routes.getGaugingStationConditionsForId);
    const id = data.dbRow.gaugingStationId;
    request = {
      method: 'GET',
      url: `/water/1.0/gauging-stations/${id}/conditions`
    };
  });
  test('returns the 200 for a valid payload', async () => {
    const response = await server.inject(request);
    expect(response.statusCode).to.equal(200);
  });
  test('returns a 400 if the search string is less than two characters long', async () => {
    const idshort = '0';
    request.url = `/water/1.0/gauging-stations/${idshort}/conditions`;
    const response = await server.inject(request);
    expect(response.statusCode).to.equal(400);
  });
});

experiment('getGaugingStationByRef', () => {
  let result;
  beforeEach(async () => {
    sandbox.stub(gaugingStationRepo, 'findOneByStationRef'); /* simulate db results */
    gaugingStationRepo.findOneByStationRef.resolves(data.dbRow);
    result = await gaugingStationService.getGaugingStationsByRef(data.dbRow.stationReference);
  });
  afterEach(async () => {
    sandbox.restore();
  });
  test('calls repos.gaugingStation.getGaugingStationsByRef()', async () => {
    const [stationReference] = gaugingStationRepo.findOneByStationRef.lastCall.args;
    expect(Array.isArray(result)).to.equal(false);
    expect(stationReference).to.equal(data.dbRow.stationReference);
  });
});

/* Below test Requires NEW table water.gauging_station_condition */
/*
experiment('getGaugingStationConditionsForId database search', () => {
  let result;

  beforeEach(async () => {
    result = await gaugingStationService.getGaugingStationConditionsForId(data.dbRow.gaugingStationId);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('calls repos.gaugingStation.getGaugingStationConditionsForId()', async () => {
    console.log('>>>>>> After promise >>>> RESULT BY getGaugingStationConditionsForId: ' + JSON.stringify(result));
    expect(Array.isArray(result)).to.equal(true);
  });
});
*/
