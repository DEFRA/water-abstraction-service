'use strict'

const { createModel } = require('./lib/helpers')
const { createMapper } = require('../object-mapper')

// Mappers
const companyMapper = require('./company')
const contactMapper = require('./contact')
const addressMapper = require('./address')

// Models
const DateRange = require('../models/date-range')
const Role = require('../models/role')

const crmToModelMapper = createMapper()
  .map('documentRoleId').to('id')
  .copy('roleName')
  .map(['startDate', 'endDate']).to('dateRange', (startDate, endDate) => new DateRange(startDate, endDate))
  .map('company').to('company', companyMapper.crmToModel)
  .map('contact').to('contact', contactMapper.crmToModel)
  .map('address').to('address', addressMapper.crmToModel)

/**
 * Map CRM document role to service Role model
 * @param {Object} crmData - pojo from CRM call
 * @return {Role}
 */
const crmToModel = crmData => createModel(Role, crmData, crmToModelMapper)

exports.crmToModel = crmToModel
