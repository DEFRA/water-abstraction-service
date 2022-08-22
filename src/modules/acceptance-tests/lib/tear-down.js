'use strict'

const { bookshelf } = require('../../../lib/connectors/bookshelf')

const billing = require('./billing')
const chargeVersions = require('./charge-versions')
const gaugingStations = require('./gauging-stations')
const returnRequirements = require('./return-requirements')
const licenceAgreements = require('./licence-agreements')
const cmConnector = require('../../../lib/connectors/charge-module/bill-runs')
const crmConnector = require('./connectors/crm')
const returnsConnector = require('./connectors/returns')
const queueManager = require('../../../lib/queue-manager')

const permits = require('./permits')
const entities = require('./entities')
const chargeVersionWorkflows = require('./charge-version-workflows')
const users = require('./users')
const notifications = require('./notifications')
const documents = require('./documents')
const events = require('./events')
const sessions = require('./sessions')

const deleteCMBatch = batch => batch.externalId && cmConnector.delete(batch.externalId)

const tearDownTable = tableName => bookshelf.knex(tableName)
  .where('is_test', true)
  .del()

/**
 * Removes all created test data
 *
 * @param {Array} [batches] - billing batch data to delete
 * @return {Promise}
 */
const tearDown = async (...batchesToDelete) => {
  await billing.tearDown()
  await gaugingStations.tearDown()
  await tearDownTable('water.gauging_stations')
  await tearDownTable('water.charge_elements')
  await chargeVersions.tearDown()
  await tearDownTable('water.licence_agreements')
  await returnRequirements.tearDown()
  await licenceAgreements.tearDown()
  await tearDownTable('water.financial_agreement_types')
  await tearDownTable('water.licence_version_purposes')
  await tearDownTable('water.licence_versions')
  await tearDownTable('water.licences')
  await tearDownTable('water.regions')

  await crmConnector.tearDown()
  console.log('Tearing down acceptance test returns')
  await returnsConnector.tearDown()

  await tearDownTable('water.purposes_primary')
  await tearDownTable('water.purposes_secondary')
  await tearDownTable('water.purposes_uses')

  // Delete CM batches
  const tasks = (batchesToDelete || []).map(deleteCMBatch)
  await Promise.all(tasks)

  // Delete Bull MQ jobs
  await queueManager.getQueueManager().deleteKeysByPattern('bull:*')

  console.log('Tearing down acceptance test notifications')
  await notifications.delete()
  console.log('Tearing down acceptance test events')
  await events.delete()

  console.log('Tearing down acceptance test permits')
  await permits.delete()
  console.log('Tearing down acceptance test entities')
  await entities.delete()
  console.log('Tearing down acceptance test documents')
  await documents.delete()
  console.log('Tearing down acceptance test users')
  await users.delete()
  console.log('Tearing down acceptance test sessions')
  await sessions.delete()
  console.log('Tearing down acceptance test charge version workflows')
  await chargeVersionWorkflows.delete()
}

exports.tearDown = tearDown
