'use strict';

const returnCyclesService = require('../../../lib/services/return-cycles');
const mapErrorResponse = require('../../../lib/map-error-response');

/**
 * Get a report of return cycles
 * @param {*} request
 * @returns
 */
const getReturnCyclesReport = async request => {
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
const getReturnCycleReturns = async (request, h) => {
  const { returnCycleId } = request.params;
  try {
    return await returnCyclesService.getReturnCycleReturns(returnCycleId);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getReturnCyclesReport = getReturnCyclesReport;
exports.getReturnCycle = getReturnCycle;
exports.getReturnCycleReturns = getReturnCycleReturns;
