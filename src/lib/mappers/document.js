'use strict'

const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')

const DateRange = require('../models/date-range')
const Document = require('../models/document')
const roleMapper = require('./role')

const crmToModelMapper = createMapper()
  .copy(
    'status',
    'roleName'
  )
  .map('documentId').to('id')
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('documentRoles').to('roles', documentRoles => documentRoles.map(roleMapper.crmToModel))
  .map('documentRef').to('licenceNumber')

const crmToModel = row => createModel(Document, row, crmToModelMapper)

exports.crmToModel = crmToModel
