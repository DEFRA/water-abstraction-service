'use strict'

const { throwIfError } = require('@envage/hapi-pg-rest-api')

const idmConnector = require('../../lib/connectors/idm')
const crmServiceVersionConnector = require('../../lib/connectors/crm/service-version')
const crmDocumentsConnector = require('../../lib/connectors/crm/documents')
const { kpiClient: crmKpiConnector } = require('../../lib/connectors/crm/kpis')
const { verificationsClient: crmVerificationsConnector } = require('../../lib/connectors/crm/verifications')
const permitConnector = require('../../lib/connectors/permit')
const returnsConnector = require('../../lib/connectors/returns')
const importConnector = require('../../lib/connectors/import')
const jobsConnector = require('../../lib/connectors/import/jobs')
const toCamelCase = require('../../lib/services/to-camel-case')

const pkg = require('../../../package.json')

const getStatus = async () => {
  return {
    data: {
      versions: await getVersions(),
      ...await getIdmData(),
      ...await getCrmData(),
      ...await getPermitData(),
      ...await getImportData()
    }
  }
}

const mapDataPoints = (dataPoints, key) => {
  return dataPoints.reduce((acc, val) => {
    const objectKey = val.dimension ? `${val.dimension}_${val.datapoint}` : val.datapoint
    acc[toCamelCase(objectKey)] = val[key]
    return acc
  }, {})
}

/**
 * Maps CRM KPIs to obejct
 * @param  {Array} data - rows of CRM KPI data
 * @return {Object}      mapped to key/value pairs
 */
const mapCrmKpi = dataPoints => mapDataPoints(dataPoints, 'value')

/**
 * Maps IDM KPIs to obejct
 * @param  {Array} data - rows of IDM KPI data
 * @return {Object}      mapped to key/value pairs
 */
const mapIdmKpi = dataPoints => mapDataPoints(dataPoints, 'measure')

/**
 * Gets total row count by calling findMany on supplied api client
 * @param  {Object}  apiClient - hapi-pg-rest-api API client
 * @return {Promise}           resolves with row count
 */
const getCount = async (apiClient, filter = {}) => {
  const firstPage = { perPage: 1 }
  const { pagination, error } = await apiClient.findMany(filter, {}, firstPage)
  throwIfError(error)
  return pagination.totalRows
}

const getKpiData = async (apiClient) => {
  const { data, error } = await apiClient.findMany()
  throwIfError(error)
  return data
}

/**
 * Gets number of users in IDM
 * @return {Promise} Resolves with number of users
 */
const getIdmUserCount = () => getCount(idmConnector.usersClient)

/**
 * Gets number of documents imported to CRM
 * @return {Promise} resolves with number of CRM docs
 */
const getCRMDocumentCount = () => getCount(crmDocumentsConnector)

/**
 * Gets number of verifications
 * @return {Promise} resolves with number of CRM verifications
 */
const getCrmVerificationCount = async () => getCount(crmVerificationsConnector)

const getIdmData = async () => {
  return {
    idm: {
      users: await getIdmUserCount(),
      ...mapIdmKpi(await getKpiData(idmConnector.kpiClient))
    }
  }
}

const getImportData = async () => {
  return {
    import: {
      jobs: {
        summary: await jobsConnector.getSummary()
      }
    }
  }
}

const getCrmData = async () => {
  return {
    crm: {
      documents: await getCRMDocumentCount(),
      ...mapCrmKpi(await getKpiData(crmKpiConnector)),
      verifications: await getCrmVerificationCount()
    }
  }
}

const getPermitData = async () => {
  return {
    permitRepo: {
      permits: await getPermitCount()
    }
  }
}

/**
 * Gets number of abstraction licences from permit repo
 * @return {Promise} resolves with number of abstraction licences
 */
const getPermitCount = async () => {
  const filter = {
    licence_regime_id: 1,
    licence_type_id: 8
  }
  return getCount(permitConnector.licences, filter)
}

const getVersions = async () => {
  const versions = {
    waterService: pkg.version,
    idm: await idmConnector.getServiceVersion(),
    crm: await crmServiceVersionConnector.getServiceVersion(),
    permit: await permitConnector.getServiceVersion(),
    returns: await returnsConnector.getServiceVersion(),
    import: await importConnector.getServiceVersion()
  }

  return versions
}

exports.getStatus = getStatus
