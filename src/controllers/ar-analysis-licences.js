/**
 * Scheduler
 * Scheduler defines and reports on tasks
 */
const HAPIRestAPI = require('@envage/hapi-pg-rest-api')
const Joi = require('joi')
const { pool } = require('../lib/connectors/db.js')

const ARAnalysisLicences = new HAPIRestAPI({
  table: 'water.ar_analysis_licences',
  primaryKey: 'licence_ref',
  endpoint: '/water/1.0/ar/licences',
  connection: pool,
  primaryKeyAuto: false,
  primaryKeyGuid: false,
  upsert: {
    fields: ['licence_ref'],
    set: ['status', 'region_code', 'start_date', 'review_date', 'approved_date', 'contact_correct']
  },
  showSql: true,
  validation: {
    licence_ref: Joi.string().required(),
    status: Joi.string(),
    region_code: Joi.number(),
    start_date: Joi.date().iso(),
    review_date: Joi.date().iso(),
    approved_date: Joi.date().iso(),
    contact_correct: Joi.boolean()
  }
})

module.exports = ARAnalysisLicences.getRoutes()
module.exports.repository = ARAnalysisLicences.repo
