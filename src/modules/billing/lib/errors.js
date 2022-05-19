const { StateError } = require('../../../lib/errors')

/**
 * The batch is not in the expected status
 */
class BatchStatusError extends StateError {
  constructor (message) {
    super(message)
    this.name = 'BatchStatusError'
  }
}

class TransactionStatusError extends StateError {
  constructor (message) {
    super(message)
    this.name = 'TransactionStatusError'
  }
}

class BillingVolumeStatusError extends StateError {
  constructor (message) {
    super(message)
    this.name = 'BillingVolumeStatusError'
  }
}

class InvoiceNumberError extends StateError {
  constructor (message) {
    super(message)
    this.name = 'InvoiceNumberError'
  }
}

exports.BatchStatusError = BatchStatusError
exports.TransactionStatusError = TransactionStatusError
exports.BillingVolumeStatusError = BillingVolumeStatusError
exports.InvoiceNumberError = InvoiceNumberError
