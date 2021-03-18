'use strict';

const returnsConnector = require('../connectors/returns');
const mapper = require('../mappers/return-cycle');
const errors = require('../errors');

const mapCycleReport = returnCycle => {
  const { returnCycleId, ...rest } = returnCycle;
  return {
    id: returnCycleId,
    ...rest
  };
};

/**
 * Gets a report of return cycle models with various stats added
 *
 * Note: because this is a report it returns plain objects rather than
 * service models
 *
 *  @returns {Promise<Array>}
 */
const getReturnCycleReport = async () => {
  const { data } = await returnsConnector.getReturnsCyclesReport('2017-11-01');
  return data.map(mapCycleReport);
};

/**
 * Gets a single return cycle, resolving with a ReturnCycle service model
 *
 * @param {String} id
 * @returns {Promise<ReturnCycle>}
 */
const getReturnCycleById = async id => {
  const data = await returnsConnector.getReturnCycleById(id);

  // Throw error if not found
  if (!data) {
    throw new errors.NotFoundError(`Return cycle ${id} not found`);
  }

  // Map to service model and return
  return mapper.returnServiceToModel(data);
};

exports.getReturnCycleReport = getReturnCycleReport;
exports.getReturnCycleById = getReturnCycleById;
