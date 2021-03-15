'use strict';

const returnsConnector = require('../connectors/returns');

/**
 * Gets a report of return cycle models with various stats added
 * @returns {Promise<Array>}
 */
const getReturnCycleReport = async () => {
  const { data } = await returnsConnector.getReturnsCyclesReport('2017-11-01');
  return data;
};

exports.getReturnCycleReport = getReturnCycleReport;
