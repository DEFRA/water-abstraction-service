'use strict'

const moment = require('moment')

const crm = require('../../../lib/connectors/crm/kpi-reporting')
const idm = require('../../../lib/connectors/idm/kpi-reporting')
const events = require('../../../lib/services/events')
const returns = require('../../../lib/connectors/returns')

const getDataFromResponseEnvelope = async connectorFunc => {
  try {
    const { data } = await connectorFunc()
    return data
  } catch (err) {
    if (err.statusCode === 404) {
      return null
    }
    throw err
  }
}

const getIDMRegistrationsData = async () => getDataFromResponseEnvelope(idm.getKPIRegistrations)
const getCRMDelegatedAccessData = async () => getDataFromResponseEnvelope(crm.getKPIAccessRequests)

// Naming licences data - events table
const getLicenceNamesData = async () => {
  const data = await events.getKPILicenceNames()
  return data
}

// Returns Monthly data - events table
const getReturnsDataByMonth = async () => {
  const data = await events.getKPIReturnsMonthly()
  return data
}

/**
 * Get last 2 return cycles
 * @param {String} [refDate] - reference date, defaults to current date
 * @returns
 */
const getReturnCycles = async refDate => {
  const startDate = moment(refDate).subtract(729, 'day').format('YYYY-MM-DD')
  try {
    const { data } = await returns.getReturnsCyclesReport(startDate)
    return data.slice(0, 2)
  } catch (err) {
    if (err.statusCode === 404) {
      return null
    }
    throw err
  }
}

module.exports.getCRMDelegatedAccessData = getCRMDelegatedAccessData
module.exports.getIDMRegistrationsData = getIDMRegistrationsData
module.exports.getReturnsDataByMonth = getReturnsDataByMonth
module.exports.getLicenceNamesData = getLicenceNamesData
module.exports.getReturnCycles = getReturnCycles
