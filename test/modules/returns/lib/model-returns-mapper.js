const { expect } = require('code');
const moment = require('moment');
moment.locale('en-gb');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const { mapReturnToModel, mapReturnToVersion, mapReturn } = require('../../../../src/modules/returns/lib/model-returns-mapper');
const returnLines = require('@envage/water-abstraction-helpers').returns.lines;

const getTestReturn = () => ({
  return_id: 'test-return-id',
  start_date: '2018-01-01',
  end_date: '2018-05-01',
  due_date: '2018-06-30',
  returns_frequency: 'month',
  metadata: {
    isFinal: false
  },
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
  beforeEach(() => {
    sandbox.stub(returnLines, 'getRequiredLines');
  });
  afterEach(() => {
    sandbox.restore();
  });
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
    let model = mapReturnToModel(testReturn, getTestVersion(), lines, versions);
    expect(model.dueDate).to.equal(testReturn.due_date);
  });

  test('adds the under query flag from the return', async () => {
    const lines = [];
    const versions = [];
    const testReturn = getTestReturn();
    const model = mapReturnToModel(testReturn, getTestVersion(), lines, versions);
    expect(model.isUnderQuery).to.be.true();
  });

  test('calls getRequiredLines with start date, end date, returns frequency, isFinal flag', async () => {
    const lines = [];
    const versions = [];
    const testReturn = getTestReturn();
    mapReturnToModel(testReturn, getTestVersion(), lines, versions);
    const args = returnLines.getRequiredLines.lastCall.args;
    expect(args[0]).to.be.equal(testReturn.start_date);
    expect(args[1]).to.be.equal(testReturn.end_date);
    expect(args[2]).to.be.equal(testReturn.returns_frequency);
    expect(args[3]).to.be.equal(testReturn.metadata.isFinal);
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
