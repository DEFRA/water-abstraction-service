'use strict'

const dataService = require('./data-service')
const supplementaryProcessor = require('./supplementary-processor')
const { logger } = require('../../../../logger')

const processBatch = async batchId => {
  try {
    logger.info(`Supplementary processing batch ${batchId}`)

    // Get historical and current batch transactions for supplementary batch licences
    const transactions = await dataService.getTransactions(batchId)

    // Process transactions
    const processedTransactions = supplementaryProcessor.processBatch(batchId, transactions)

    return await dataService.persistChanges(batchId, processedTransactions)
  } catch (err) {
    logger.error(`Supplementary processing error for batch ${batchId}`, err)
    throw err
  }
}

exports.processBatch = processBatch
