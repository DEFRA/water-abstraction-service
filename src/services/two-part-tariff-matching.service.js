'use strict'

const { BillingBatchChargeVersionYear } = require('../lib/connectors/bookshelf')

class TwoPartTariffMatchingService {
  static async go (billingBatch) {
    const billingBatchChargeVersionYears = await this._billingBatchChargeVersionYears(billingBatch)

    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      await this._processBillingBatchChargeVersionYear(billingBatchChargeVersionYear)
    }

    return billingBatchChargeVersionYears
  }

  static async _processBillingBatchChargeVersionYear (billingBatchChargeVersionYear) {
    const { chargeVersionId, financialYearEnding, isSummer, billingBatchId } = billingBatchChargeVersionYear
  }

  static async _billingBatchChargeVersionYears (billingBatch) {
    const conditions = {
      billing_batch_id: billingBatch.id,
      transaction_type: 'two_part_tariff'
    }

    const result = await new BillingBatchChargeVersionYear()
      .where(conditions)
      .fetchAll({ require: false })

    return result
  }
}

module.exports = TwoPartTariffMatchingService
