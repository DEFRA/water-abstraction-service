
const returnsConnector = require('../services/connectors/returns');
const uuidv4 = require('uuid/v4');
const returnsData = require('./data/returns');
const returnLinesData = require('./data/return-lines');
const returnVersions = require('./data/return-versions');

/**
 * Maps return model back to a return version row
 * @param {Object} ret - return model
 * @return {Object} version row for returns service
 */
const mapVersion = (ret, returnId) => {
  return {
    version_id: uuidv4(),
    return_id: returnId,
    user_id: ret.userId,
    user_type: ret.userType,
    version_number: ret.versionNumber,
    metadata: JSON.stringify({
      ...ret.reading,
      meters: ret.meters
    }),
    nil_return: ret.isNil,
    current: ret.current
  };
};

/**
 * Maps return model back to return lines
 * @param {Object} ret - return model
 * @return {Array} lines rows for returns service
 */
const mapLine = (line, versionId) => {
  return {
    line_id: uuidv4(),
    version_id: versionId,
    substance: 'water',
    quantity: line.quantity,
    unit: 'm³',
    user_unit: 'm³',
    start_date: line.startDate,
    end_date: line.endDate,
    time_period: line.timePeriod,
    metadata: JSON.stringify(line.metadata),
    reading_type: 'measured'
  };
};

/**
 * Maps test data to those fields that need updating in returns service
 * @param {Object} ret - test data
 * @return {Object} data to store in returns table of returns service
 */
const mapReturn = (ret, licenceRef) => {
  return {
    return_id: ret.returnId,
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: licenceRef,
    start_date: ret.startDate,
    end_date: ret.endDate,
    due_date: ret.dueDate,
    returns_frequency: ret.returnsFrequency,
    status: ret.status,
    source: ret.source,
    metadata: JSON.stringify(ret.metadata),
    received_date: ret.receivedDate,
    return_requirement: ret.returnRequirement,
    under_query: ret.underQuery,
    under_query_comment: 'nothing',
    is_test: true
  };
};

/**
 * Persists return data to return service
 * @param {Object} ret - return model
 * @return {Promise} resolves when saved successfully
 */
const createReturnsData = async (returnRow, licenceRef) => {
  console.log('const createReturnsData = async (returnRow, licenceRef) => {');
  const { data: retdata } = await returnsConnector.createReturn(mapReturn(returnsData[returnRow.return], licenceRef));
  const { data: version } = await returnsConnector.createVersions(mapVersion(returnVersions[returnRow.version], retdata.return_id));
  const returnLines = [];
  for (const key of returnRow.lines) {
    const { data: returnLine } = await returnsConnector.createLines(mapLine(returnLinesData[key], version.version_id));
    console.log(returnLine);
    returnLines.push(returnLine);
  }
  return { retdata, version, returnLines };
};
/**
 * Tears down data in Returns
 * @return {Promise}
 */
const tearDown = async () => {
  console.log('tearing down returns');
  const torn = await returnsConnector.tearDown();
  console.log(torn);
  console.log('returns torn');
  return torn;
};

exports.create = createReturnsData;
exports.tearDown = tearDown;
