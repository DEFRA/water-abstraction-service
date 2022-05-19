'use strict'

const { createModel } = require('./lib/helpers')
const { createMapper } = require('../object-mapper')

const ReturnCycle = require('../models/return-cycle')
const DateRange = require('../models/date-range')

const returnsServiceToModelMapper = createMapper()
  .map('returnCycleId').to('id')
  .copy(
    'isSummer'
  )
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))

const returnServiceToModel = row => createModel(ReturnCycle, row, returnsServiceToModelMapper)

exports.returnServiceToModel = returnServiceToModel
