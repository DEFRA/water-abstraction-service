const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const gaugingStationsRepo = require('../../../../src/controllers/gauging-stations');
const { searchGaugingStations } = require('../../../../src/modules/internal-search/lib/search-gauging-stations');

experiment('modules/internal-search/lib/search-gauging-stations', () => {
  const output = {
    rows: [
      {
        wiski_id: 'WISKI1',
        station_reference: 'REF1',
        label: 'Station one'
      },
      {
        wiski_id: 'WISKI2',
        station_reference: 'REF2',
        label: 'Station two'
      },
      {
        wiski_id: 'WISKI3',
        station_reference: 'REF3',
        label: 'Station three'
      }
    ]
  };

  experiment('searchGaugingStations', () => {
    let stub;

    beforeEach(async () => {
      stub = await sandbox.stub(gaugingStationsRepo.repository, 'find').resolves(output);
    });

    afterEach(() => {
      sandbox.restore();
    });

    test('It should throw an error if an error returned by the connector', () => {
      stub.resolves({ error: 'Some error' });
      expect(searchGaugingStations('SEARCH TERM')).to.reject();
    });

    test('It should call the connector with the first time with the correct filter', () => {
      stub.resolves({ rows: [] });
      searchGaugingStations('SEARCH TERM');
      const [filter] = stub.firstCall.args;
      expect(filter).to.equal({
        station_reference: {
          $equals: 'SEARCH TERM'
        }
      });
    });

    test('It should return the available stations, if the label is a partial match', async () => {
      await stub.resolves(output);
      const gaugingStations = await searchGaugingStations('Station');
      expect(gaugingStations.length).to.equal(3);
    });
  });
});
