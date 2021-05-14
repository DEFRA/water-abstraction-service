const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const gaugingStationsRepo = require('../../../../src/lib/connectors/repos/gauging-stations');
const { searchGaugingStations } = require('../../../../src/modules/internal-search/lib/search-gauging-stations');

experiment('modules/internal-search/lib/search-gauging-stations', () => {
  const output = [
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
  ];

  experiment('searchGaugingStations', () => {
    let stub1, stub2, stub3;

    beforeEach(async () => {
      stub1 = await sandbox.stub(gaugingStationsRepo, 'findOneByStationRef').resolves(null);
      stub2 = await sandbox.stub(gaugingStationsRepo, 'findOneByWiskiId').resolves(null);
      stub3 = await sandbox.stub(gaugingStationsRepo, 'findAllByPartialNameMatch').resolves(null);
    });

    afterEach(() => {
      sandbox.restore();
    });

    test('It should return the available stations, if the label is a partial match', async () => {
      await stub3.resolves(output);
      const gaugingStations = await searchGaugingStations('Station');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations.length).to.equal(3);
    });

    test('It should return the correct station, if the Wiski ID is a full match', async () => {
      await stub2.resolves(output[1]);
      const gaugingStations = await searchGaugingStations('Station');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations).to.equal([output[1]]);
    });

    test('It should return the correct station, if the Wiski ID is a full match', async () => {
      await stub2.resolves(output[0]);
      const gaugingStations = await searchGaugingStations('Station');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations).to.equal([output[0]]);
    });

    test('It should return an empty array, if nothing matches', async () => {
      const gaugingStations = await searchGaugingStations('sugar lumps');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations).to.equal([]);
    });
  });
});
