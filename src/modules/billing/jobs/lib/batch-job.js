'use strict'

const { logger } = require('../../../../logger')
const batchService = require('../../services/batch-service')

const logHandling = job => {
  logger.info(`Handling: ${job.id}`)
}

const logInfo = (job, msg) => {
  logger.info(`Info: ${job.id} - ${msg}`)
}

const logOnComplete = job => {
  logger.info(`onComplete: ${job.id}`)
}

const logOnCompleteError = (job, error) => {
  logger.error(`Error handling onComplete: ${job.id}`, error.stack, job.data)
}

const logHandlingError = (job, error) => {
  logger.error(`Error handling: ${job.id}`, error.stack, job.data)
}

/**
 * When an error has occurred in the PG boss handler,
 * we need to:
 * - Log the message
 * - Mark the batch is in error status
 * @param {Object} job - PG boss message
 * @param {Error} err - the error thrown in the handler
 * @param {Number} errorCode - batch error code
 * @return {Error} returns the modified error
 */
const logHandlingErrorAndSetBatchStatus = async (job, err, errorCode) => {
  // Decorate error with error code and log
  err.errorCode = errorCode
  logHandlingError(job, err)

  // Mark batch as in error status
  const batchId = job.data.batchId
  await batchService.setErrorStatus(batchId, errorCode)
  return err
}

exports.logInfo = logInfo
exports.logHandling = logHandling
exports.logHandlingError = logHandlingError
exports.logOnComplete = logOnComplete
exports.logOnCompleteError = logOnCompleteError
exports.logHandlingErrorAndSetBatchStatus = logHandlingErrorAndSetBatchStatus
