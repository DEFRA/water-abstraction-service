'use strict'

const returnCyclesService = require('../../../lib/services/return-cycles')
const controller = require('../../../lib/controller')

/**
 * Get a report of return cycles
 * @param {*} request
 */
const getReturnCyclesReport = () =>
  controller.getEntities(null, returnCyclesService.getReturnCycleReport)

/**
 * Get the specified return cycle model by ID
 * @param {String} request.params.returnCycleId
 */
const getReturnCycle = request => request.pre.returnCycle

/**
 * Get the specified return cycle model by ID
 * @param {String} request.params.returnCycleId
 */
const getReturnCycleReturns = request =>
  controller.getEntities(request.params.returnCycleId, returnCyclesService.getReturnCycleReturns)

exports.getReturnCyclesReport = getReturnCyclesReport
exports.getReturnCycle = getReturnCycle
exports.getReturnCycleReturns = getReturnCycleReturns
