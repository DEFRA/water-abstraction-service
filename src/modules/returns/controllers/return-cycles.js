'use strict';

const returnCyclesService = require('../../../lib/services/return-cycles');
const mapErrorResponse = require('../../../lib/map-error-response');

/**
 * Get a report of return cycles
 * @param {*} request
 * @returns
 */
const getReturnCyclesReport = async () => {
  const data = await returnCyclesService.getReturnCycleReport();
  return { data };
};

/**
 * Get the specified return cycle model by ID
 */
const getReturnCycle = async request => request.pre.returnCycle;

/**
 * Get the specified return cycle model by ID
 */
const getReturnCycleReturns = async request => {
  const { returnCycleId } = request.params;
  try {
    const data = await returnCyclesService.getReturnCycleReturns(returnCycleId);
    return { data };
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getReturnCyclesReport = getReturnCyclesReport;
exports.getReturnCycle = getReturnCycle;
exports.getReturnCycleReturns = getReturnCycleReturns;
