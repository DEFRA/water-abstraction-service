const returnsConnector = require('../../../lib/connectors/returns');
const waterHelpers = require('@envage/water-abstraction-helpers');
const { getReturnId } = require('../../../lib/returns');
const { ACCEPTANCE_TEST_SOURCE } = require('./constants');
const moment = require('moment');
const FORMAT_ID = '9999999';

/**
 * Creates a test row for the returns.returns table
 * @param {String} licenceRef The licence ref
 * @param {Object} cycle An object containing the start and end dates of the return cycle
 * @param {Object} metadata Returns metadata
 * @param {String} frequency The returns frequency (day|week |month|quarter|year)
 * @param {String} status The returns status (completed|due|void|received))
 */
const createReturnRow = (licenceRef, cycle, metadata, frequency = 'day', status = 'due') => {
  return {
    return_id: getReturnId(6, licenceRef, FORMAT_ID, cycle.startDate, cycle.endDate),
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: licenceRef,
    start_date: cycle.startDate,
    end_date: cycle.endDate,
    returns_frequency: frequency,
    status,
    source: ACCEPTANCE_TEST_SOURCE,
    metadata: JSON.stringify(metadata),
    received_date: null,
    return_requirement: FORMAT_ID,
    due_date: moment().add(1, 'month').format('YYYY-MM-DD')
  };
};

const createReturnMetadata = (isSummer) => {
  return {
    nald: {
      formatId: FORMAT_ID,
      regionCode: 6,
      periodEndDay: '31',
      periodEndMonth: '12',
      periodStartDay: '1',
      periodStartMonth: '1'
    },
    points: [
      {
        name: 'Test point name',
        ngr1: 'AT 123 123',
        ngr2: null,
        ngr3: null,
        ngr4: null
      }
    ],
    version: 1,
    isSummer,
    isUpload: true,
    purposes: [
      {
        alias: 'Evaporative Cooling',
        primary: { code: 'P', description: 'Production Of Energy' },
        secondary: { code: 'ELC', description: 'Electricity' },
        tertiary: { code: '80', description: 'Evaporative Cooling' }
      }
    ],
    isCurrent: true,
    description: 'Return metadata description',
    isTwoPartTariff: false
  };
};

const createDueReturn = async (licenceRef) => {
  const cycles = waterHelpers.returns.date.createReturnCycles();
  const cycle = cycles.pop();

  const metadata = createReturnMetadata(cycle.isSummer);
  const row = createReturnRow(licenceRef, cycle, metadata);

  const result = await returnsConnector.returns.create(row);
  console.log(result);
  return result.data;
};

exports.delete = () => returnsConnector.deleteAcceptanceTestData();
exports.createDueReturn = createDueReturn;
