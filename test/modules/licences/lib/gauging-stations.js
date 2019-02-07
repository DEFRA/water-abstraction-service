const sinon = require('sinon');
const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { repository } = require('../../../../src/controllers/gauging-stations');

const gaugingStations = require('../../../../src/modules/licences/lib/gauging-stations');

const licence = {
  metadata: {
    gaugingStations: [{
      stationReference: 'ABCD1'
    }, {
      stationReference: 'DEFG2'
    }]
  }
};

experiment('mapGaugingStation', () => {
  test('maps a single row of gauging station data to a format output by the API', async () => {
    const data = {
      label: 'Test name',
      grid_reference: 'SP 123 456',
      station_reference: 'A1234'
    };
    const result = gaugingStations.mapGaugingStation(data);
    expect(result).to.equal({
      name: data.label,
      gridReference: data.grid_reference,
      stationReference: data.station_reference
    });
  });
});

experiment('getGaugingStations', () => {
  beforeEach(async () => {
    sinon.stub(repository, 'find').resolves({
      rows: []
    });
  });

  afterEach(async () => {
    repository.find.restore();
  });

  test('It should return an empty array if the licence has no gauging stations in metadata', async () => {
    const licence = {
      metadata: {}
    };
    const result = await gaugingStations.getGaugingStations(licence);
    expect(result).to.equal([]);
  });

  test('It should fetch data from the gauging_stations table with correct query', async () => {
    const result = await gaugingStations.getGaugingStations(licence);

    const [filter] = repository.find.firstCall.args;

    expect(filter).to.equal({
      station_reference: {
        $in: ['ABCD1', 'DEFG2']
      }
    });

    expect(result).to.be.an.array();
  });
});
