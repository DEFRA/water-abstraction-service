const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();

const { mapReturnToModel, mapReturnToVersion } = require('../../../../src/modules/returns/lib/model-returns-mapper');

const getTestReturn = () => ({
  return_id: 'test-return-id',
  start_date: '2018-01-01',
  end_date: '2018-05-01',
  returns_frequency: 'month'
});

const getTestReadingData = () => ({
  type: 'measured',
  total: null,
  units: 'm³',
  method: null,
  totalFlag: false
});

const getTestMeter = () => ({
  manufacturer: 'test-man',
  serialNumber: '1234v3',
  multiplier: 10,
  startReading: 1000,
  readings: {
    '2018-01-01_2018-02-31': 2000,
    '2018-02-01_2018-02-28': 2000
  }
});

const getTestVersion = (hasMeters = false) => {
  const version = {
    metadata: getTestReadingData()
  };

  if (hasMeters) {
    version.metadata.meters = [getTestMeter()];
  }

  return version;
};

experiment('mapReturnToModel', () => {
  test('assigns the reading meta data when no meters', async () => {
    const lines = [];
    const versions = [];
    const model = mapReturnToModel(getTestReturn(), getTestVersion(), lines, versions);
    expect(model.reading).to.equal(getTestReadingData());
  });

  test('assigns the reading meta data when version has meters', async () => {
    const lines = [];
    const versions = [];
    const model = mapReturnToModel(getTestReturn(), getTestVersion(true), lines, versions);
    expect(model.reading).to.only.include(getTestReadingData());
  });

  test('meters is an empty array when version has no meters', async () => {
    const lines = [];
    const versions = [];
    const model = mapReturnToModel(getTestReturn(), getTestVersion(), lines, versions);
    expect(model.meters).to.equal([]);
  });

  test('meters is populated when version has meters', async () => {
    const lines = [];
    const versions = [];
    const model = mapReturnToModel(getTestReturn(), getTestVersion(true), lines, versions);
    expect(model.meters).to.have.length(1);
    expect(model.meters[0]).to.equal(getTestMeter());
  });
});

experiment('mapReturnToVersion', () => {
  test('sets the metadata using the reading', async () => {
    const returnModel = {
      user: {},
      reading: getTestReadingData()
    };
    const mappedVersion = mapReturnToVersion(returnModel);

    expect(JSON.parse(mappedVersion.metadata)).to.equal(getTestReadingData());
  });

  test('sets the metadata using the reading and meters when passed', async () => {
    const returnModel = {
      user: {},
      reading: getTestReadingData(),
      meters: [getTestMeter()]
    };
    const mappedVersion = mapReturnToVersion(returnModel);

    const expectedMetadata = {
      ...getTestReadingData(),
      meters: [getTestMeter()]
    };

    expect(JSON.parse(mappedVersion.metadata)).to.equal(expectedMetadata);
  });
});
