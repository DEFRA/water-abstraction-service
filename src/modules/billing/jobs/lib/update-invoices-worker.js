const Bluebird = require('bluebird')
const { isNull, difference, omit } = require('lodash')

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

const getWRLSInvoiceKey = invoice => isNull(invoice.rebillingState)
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
    return {
      ...(omit(srocTransaction, ['id', 'value', 'isCompensationCharge'])),
      scheme: 'sroc',
      billingTransactionId: cmTransaction.clientId,
      netAmount: cmTransaction.chargeValue,
      chargeType: cmTransaction.compensationCharge ? 'compensation' : 'standard',
      calcS126Factor: srocTransaction.calcS126Factor ? (srocTransaction.calcS126Factor.trim()).split('x')[1] || null : null,
      calcS127Factor: srocTransaction.calcS127Factor ? (srocTransaction.calcS127Factor.trim()).split('x')[1] || null : null,
      calcS130Factor: srocTransaction.calcS130Factor ? (srocTransaction.calcS130Factor.trim()).split('x')[1] || null : null,
      calcWinterDiscountFactor: srocTransaction.calcWinterDiscountFactor ? (srocTransaction.calcWinterDiscountFactor.trim()).split('x')[1] || null : null,
      grossValuesCalculated: cmTransaction.calculation.WRLSChargingResponse.decisionPoints
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

process.on('message', async data => {
  try {
    const invoices = await invoiceService.getInvoicesForBatch(data.batch, { includeTransactions: true })
    process.send('Started updating invoices')
    const returnableMaps = invoiceMaps(invoices, data.cmResponse)
    process.send('returnableMaps are now built')
    return Bluebird.each(returnableMaps.cm, async ([key, cmInvoice]) => {
      const invoice = returnableMaps.wrls.get(key)
      if (invoice) {
        const cmTransactions = await getAllCmTransactionsForInvoice(
          data.batch.externalId,
          cmInvoice.id
        )

        process.send(`Found ${cmTransactions.length} transactions to process from the CM for invoice ${invoice.id}`)
        // Populate invoice model with updated CM data
        invoice.fromHash(
          invoiceMapper.cmToPojo(cmInvoice, cmTransactions)
        )

        // Persist invoice and transactions to DB
        await invoiceService.updateInvoiceModel(invoice)
        await updateTransactions(invoice, cmTransactions, data.batch.scheme)
      }
    })
  } catch (e) {
    process.send({ error: e })
  }
})
