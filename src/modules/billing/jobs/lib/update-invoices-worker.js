'use strict'

const { difference } = require('lodash')

// Models
const Transaction = require('../../../../lib/models/transaction')

// Services
const invoiceService = require('../../../../lib/services/invoice-service')
const transactionService = require('../../services/transactions-service')

// Mappers
const invoiceMapper = require('../../../../lib/mappers/invoice')
const transactionMapper = require('../../mappers/transaction')

// Connectors
const chargeModuleBillRunConnector = require('../../../../lib/connectors/charge-module/bill-runs')

const { logger } = require('../../../../logger')

const getCustomerFinancialYearKey = (invoiceAccountNumber, financialYearEnding) =>
  `${invoiceAccountNumber}_${financialYearEnding}`

const getWRLSInvoiceKey = invoice => invoice?.rebillingState === null
  ? getCustomerFinancialYearKey(invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear)
  : invoice.externalId

const getCMInvoiceKey = cmInvoice => cmInvoice.rebilledType === 'O'
  ? getCustomerFinancialYearKey(cmInvoice.customerReference, cmInvoice.financialYear + 1)
  : cmInvoice.id

const createMap = (items, keyMapper) => items.reduce(
  (map, item) => map.set(keyMapper(item), item),
  new Map()
)

const invoiceMaps = (invoices, cmResponse) => ({
  wrls: createMap(invoices, getWRLSInvoiceKey),
  cm: createMap(cmResponse.billRun.invoices, getCMInvoiceKey)
})

const mapTransaction = (transactionMap, cmTransaction, scheme) => {
  if (scheme === 'sroc') {
    const srocTransaction = transactionMapper.cmToPojo(cmTransaction)
    delete srocTransaction.id
    delete srocTransaction.value
    delete srocTransaction.isCompensationCharge

    const grossValuesCalculated = {
      ...cmTransaction.calculation.WRLSChargingResponse.decisionPoints,
      baselineCharge: cmTransaction.calculation.WRLSChargingResponse.baselineCharge,
      supportedSourceCharge: cmTransaction.calculation.WRLSChargingResponse.supportedSourceCharge,
      waterCompanyCharge: cmTransaction.calculation.WRLSChargingResponse.waterCompanyCharge
    }

    // If the CM transaction has a clientId then this is the billingTransactionId of our transaction record. If it
    // doesn't have a clientId (which happens if one isn't set when creating the transaction, eg. if it was created by
    // the CM during reissuing) then we need to take the CM transaction's id and pull the matching record from
    // transactionMap (which is indexed by those CM transaction ids). We can then read the id value of the record, which
    // (confusingly!) is the field that the billingTransactionId has been mapped to.
    const billingTransactionId = cmTransaction.clientId ?? transactionMap.get(cmTransaction.id).id

    return {
      ...(srocTransaction),
      billingTransactionId,
      scheme: 'sroc',
      netAmount: cmTransaction.chargeValue,
      chargeType: cmTransaction.compensationCharge ? 'compensation' : 'standard',
      calcS126Factor: srocTransaction.calcS126Factor ? (srocTransaction.calcS126Factor.trim()).split('x')[1] || null : null,
      calcS127Factor: srocTransaction.calcS127Factor ? (srocTransaction.calcS127Factor.trim()).split('x')[1] || null : null,
      calcS130Factor: srocTransaction.calcS130Factor ? (srocTransaction.calcS130Factor.trim()).split('x')[1] || null : null,
      calcWinterDiscountFactor: srocTransaction.calcWinterDiscountFactor ? (srocTransaction.calcWinterDiscountFactor.trim()).split('x')[1] || null : null,
      grossValuesCalculated
    }
  } else {
    const transaction = transactionMap.has(cmTransaction.id)
      ? transactionMap.get(cmTransaction.id)
      : new Transaction()
    return transaction.fromHash(transactionMapper.cmToPojo(cmTransaction))
  }
}

const getTransactionMap = invoice => {
  return invoice.invoiceLicences.reduce((map, invoiceLicence) => {
    invoiceLicence.transactions.forEach(transaction => {
      map.set(transaction.externalId, transaction)
    })
    return map
  }, new Map())
}

const getCMTransactionId = cmTransaction => cmTransaction.id

const deleteTransactions = (cmTransactions, transactionMap) => {
  const validIds = cmTransactions.map(getCMTransactionId)
  const deleteExternalIds = difference(Array.from(transactionMap.keys()), validIds)
  const deleteIds = deleteExternalIds.map(
    externalId => transactionMap.get(externalId).id
  )
  return transactionService.deleteById(deleteIds)
}

const updateTransactions = async (invoice, cmTransactions, scheme) => {
  // Index WRLS transactions by external ID
  const transactionMap = getTransactionMap(invoice)
  // Create/update transactions
  for (const cmTransaction of cmTransactions) {
    const invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(cmTransaction.licenceNumber)
    const transaction = mapTransaction(transactionMap, cmTransaction, scheme)
    await transactionService.saveTransactionToDB(invoiceLicence, transaction)
  }

  // Delete transactions no longer on the CM side
  return deleteTransactions(cmTransactions, transactionMap)
}

const getAllCmTransactionsForInvoice = async (cmBillRunId, invoiceId) => {
  try {
    const { invoice } = await chargeModuleBillRunConnector.getInvoiceTransactions(cmBillRunId, invoiceId)
    return invoice.licences.map(lic => lic.transactions.map(transaction => {
      return {
        ...transactionMapper.inverseCreditNoteSign(transaction),
        transactionReference: invoice.transactionReference,
        isDeminimis: invoice.deminimisInvoice,
        licenceNumber: lic.licenceNumber
      }
    })).flat()
  } catch (error) {
    logger.error(`Unable to retrieve transactions for CM invoice. Bill run ID ${cmBillRunId} and invoice ID ${invoiceId}`)
    throw error
  }
}

async function updateInvoices (job, logger) {
  const startTime = process.hrtime.bigint()

  logger.info(`onHandler: ${job.id} - started update of invoices from CHA`)

  const { batch, cmResponse } = job.data
  const invoices = await invoiceService.getInvoicesForBatch(batch, { includeTransactions: true })
  const returnableMaps = invoiceMaps(invoices, cmResponse)

  // We set the batch size and number of billing accounts here rather than determine them for every iteration of the
  // loop. It's a very minor nod towards performance.
  const batchSize = 10
  const cmInvoices = [...returnableMaps.cm]
  const cmInvoiceCount = cmInvoices.length

  for (let i = 0; i < cmInvoiceCount; i += batchSize) {
    const invoicesToProcess = cmInvoices.slice(i, i + batchSize)

    const processes = invoicesToProcess.map(async ([key, cmInvoice]) => {
      const invoice = returnableMaps.wrls.get(key)

      if (invoice) {
        const cmTransactions = await getAllCmTransactionsForInvoice(batch.externalId, cmInvoice.id)

        logger.info(`onHandler: ${job.id} - Found ${cmTransactions.length} transactions to process from the CM for invoice ${invoice.id}`)
        // Populate invoice model with updated CM data
        invoice.fromHash(
          invoiceMapper.cmToPojo(cmInvoice, cmTransactions)
        )

        // Persist invoice and transactions to DB
        await invoiceService.updateInvoiceModel(invoice)
        return updateTransactions(invoice, cmTransactions, batch.scheme)
      }
    })

    await Promise.all(processes)
  }

  const { timeTakenMs, timeTakenSs } = _calculateTimeTaken(startTime)
  logger.info(`onHandler: ${job.id} - completed update of invoices from CHA (${timeTakenMs}ms / ${timeTakenSs}s)`)
}

function _calculateTimeTaken (startTime) {
  const endTime = process.hrtime.bigint()
  const timeTakenNs = endTime - startTime
  const timeTakenMs = timeTakenNs / 1000000n
  const timeTakenSs = timeTakenMs / 1000n

  return {
    timeTakenMs,
    timeTakenSs
  }
}

module.exports = {
  updateInvoices
}
