'use strict'

const returnsConnector = require('../connectors/returns')
const mapper = require('../mappers/return-cycle')
const DateRange = require('../models/date-range')
const User = require('../models/user')

const mapCycleReport = returnCycle => {
  const { returnCycleId, startDate, endDate, ...rest } = returnCycle
  return {
    id: returnCycleId,
    dateRange: new DateRange(startDate, endDate),
    ...rest
  }
}

/**
 * Gets a report of return cycle models with various stats added
 *
 * Note: because this is a report it returns plain objects rather than
 * service models
 *
 *  @returns {Promise<Array>}
 */
const getReturnCycleReport = async () => {
  const { data } = await returnsConnector.getReturnsCyclesReport('2017-11-01')
  return data.map(mapCycleReport)
}

/**
 * Gets a single return cycle, resolving with a ReturnCycle service model
 *
 * @param {String} id
 * @returns {Promise<ReturnCycle>}
 */
const getReturnCycleById = async id => {
  const data = await returnsConnector.getReturnCycleById(id)
  return data ? mapper.returnServiceToModel(data) : null
}

const mapCycleReturn = row => {
  const { returnId, startDate, endDate, userId: email, ...rest } = row
  return {
    id: returnId,
    dateRange: new DateRange(startDate, endDate),
    user: email ? new User().fromHash({ email }) : null,
    ...rest
  }
}

/**
 * Gets a report of returns within a return cycle
 *
 * Note: because this is a report it returns plain objects rather than
 * service models
 *
 *  @returns {Promise<Array>}
 */
const getReturnCycleReturns = async returnCycleId => {
  const { data } = await returnsConnector.getReturnCycleReturns(returnCycleId)
  return data.map(mapCycleReturn)
}

exports.getReturnCycleReport = getReturnCycleReport
exports.getReturnCycleById = getReturnCycleById
exports.getReturnCycleReturns = getReturnCycleReturns
