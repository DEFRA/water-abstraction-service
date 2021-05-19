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

    test('It should return the correct station, if the station reference is a full match', async () => {
      await stub1.resolves(output[2]);
      const gaugingStations = await searchGaugingStations('REF3');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations).to.equal([output[2]]);
    });

    test('It should return an empty array, if nothing matches (1 of 2)', async () => {
      await stub3.resolves([]);
      const gaugingStations = await searchGaugingStations('sugar lumps');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations).to.equal([]);
    });

    test('It should return an empty array, if nothing matches (2 of 2)', async () => {
      const gaugingStations = await searchGaugingStations('sugar lumps');
      expect(stub1.called).to.be.true();
      expect(stub2.called).to.be.true();
      expect(stub3.called).to.be.true();
      expect(gaugingStations).to.equal([]);
    });
  });
});
