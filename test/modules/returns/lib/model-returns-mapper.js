const { expect } = require('@hapi/code');
const moment = require('moment');
moment.locale('en-gb');

const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { mapReturnToModel, mapReturnToVersion, mapReturn } = require('../../../../src/modules/returns/lib/model-returns-mapper');

const getTestReturn = () => ({
  return_id: 'test-return-id',
  start_date: '2018-01-01',
  end_date: '2018-05-01',
  due_date: '2018-06-30',
  returns_frequency: 'month',
  under_query: true
});

const getTestReadingData = () => ({
  type: 'measured',
  total: null,
  units: 'm³',
  method: null,
  totalFlag: false,
  totalCustomDates: false,
  totalCustomDateStart: null,
  totalCustomDateEnd: null
});

const getTestMeter = () => ({
  manufacturer: 'test-man',
  meterDetailsProvided: true,
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

  test('adds the dueDate from the return', async () => {
    const lines = [];
    const versions = [];
    const testReturn = getTestReturn();
    const model = mapReturnToModel(testReturn, getTestVersion(), lines, versions);
    expect(model.dueDate).to.equal(testReturn.due_date);
  });

  test('adds the under query flag from the return', async () => {
    const lines = [];
    const versions = [];
    const testReturn = getTestReturn();
    const model = mapReturnToModel(testReturn, getTestVersion(), lines, versions);
    expect(model.isUnderQuery).to.be.true();
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

experiment('mapReturn', () => {
  test('extracts only the expected data', async () => {
    const receivedDate = moment().toISOString();
    const returnModel = {
      returnId: '123',
      status: 'due',
      receivedDate,
      isNil: false,
      isCurrent: true,
      isUnderQuery: true
    };

    const mapped = mapReturn(returnModel);
    expect(mapped).to.equal({
      status: 'due',
      received_date: receivedDate,
      under_query: true
    });
  });
});
