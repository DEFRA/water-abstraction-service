'use strict';

const returnsConnector = require('../../../lib/connectors/returns');
const waterHelpers = require('@envage/water-abstraction-helpers');
const { getReturnId } = waterHelpers.returns;
const moment = require('moment');

/**
 * Creates a test row for the returns.returns table
 * @param {String} licenceRef The licence ref
 * @param {Object} cycle An object containing the start and end dates of the return cycle
 * @param {Object} metadata Returns metadata
 * @param {String} frequency The returns frequency (day|week |month|quarter|year)
 * @param {String} status The returns status (completed|due|void|received))
 * @param {String} formatId The external id also used for the return requirements in the water schema
 */
const createReturnRow = (licenceRef, cycle, metadata, formatId, frequency = 'day', status = 'due') => {
  return {
    return_id: getReturnId(6, licenceRef, formatId, cycle.startDate, cycle.endDate),
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: licenceRef,
    start_date: cycle.startDate,
    end_date: cycle.endDate,
    returns_frequency: frequency,
    status,
    metadata: JSON.stringify(metadata),
    received_date: null,
    return_requirement: formatId,
    due_date: moment().add(1, 'month').format('YYYY-MM-DD'),
    is_test: true
  };
};

const createReturnMetadata = (isSummer, formatId) => {
  return {
    nald: {
      formatId,
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

const createDueReturn = async (licenceRef, frequency, formatId, oldReturn = false) => {
  const cycles = waterHelpers.returns.date.createReturnCycles();
  const cycle = cycles.pop();

  const metadata = createReturnMetadata(cycle.isSummer, formatId);
  const row = createReturnRow(licenceRef, cycle, metadata, formatId, frequency, 'due');
  if (oldReturn) {
    row.due_date = moment().add(-1, 'year').format('YYYY-MM-DD');
  };
  const result = await returnsConnector.returns.create(row);
  return result.data;
};

exports.delete = () => returnsConnector.deleteAcceptanceTestData();
exports.createDueReturn = createDueReturn;
