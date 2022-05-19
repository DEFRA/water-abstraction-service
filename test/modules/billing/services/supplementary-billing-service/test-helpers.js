'use strict'

const createTransaction = (billingBatchId, id, overrides = {}) => {
  const defaults = {
    billingTransactionId: id,
    billingInvoiceLicenceId: 'billing-invoice-licence-1',
    chargeElementId: 'charge-element-1',
    startDate: '2014-04-01',
    endDate: '2015-03-31',
    abstractionPeriod: {
      endDay: 31,
      endMonth: 3,
      startDay: 1,
      startMonth: 4
    },
    netAmount: null,
    isCredit: false,
    authorisedQuantity: '21.48',
    billableQuantity: null,
    authorisedDays: 365,
    billableDays: 365,
    status: 'candidate',
    description: 'Big stream near the babbling brook',
    dateCreated: '2021-02-26T13:01:28.732Z',
    dateUpdated: '2021-02-26T13:01:28.732Z',
    source: 'unsupported',
    season: 'all year',
    loss: 'medium',
    chargeType: 'standard',
    externalId: null,
    volume: '21.48',
    section126Factor: null,
    section127Agreement: false,
    section130Agreement: null,
    isTwoPartTariffSupplementary: false,
    calculatedVolume: null,
    twoPartTariffError: null,
    twoPartTariffStatus: null,
    twoPartTariffReview: null,
    isDeMinimis: false,
    isNewLicence: false,
    legacyId: null,
    metadata: null,
    sourceTransactionId: null,
    licenceId: 'licence-1',
    licenceRef: '01/123/A',
    invoiceAccountNumber: 'A00000000A',
    financialYearEnding: 2021,
    invoiceAccountId: 'invoice-account-1',
    billingBatchId,
    isSummer: false,
    rebillingState: null
  }

  return Object.assign(defaults, overrides)
}

const findTransactionById = (result, id) => result.find(
  transaction => transaction.billingTransactionId === id
)

exports.createTransaction = createTransaction
exports.findTransactionById = findTransactionById
