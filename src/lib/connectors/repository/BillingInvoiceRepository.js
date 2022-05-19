'use strict'
const { get } = require('lodash')
const Repository = require('@envage/hapi-pg-rest-api/src/repository')
const db = require('../db')

const findByBatchIdQuery = `
  select
    i.billing_invoice_id as "billing_invoices.billing_invoice_id",
    i.invoice_account_id as "billing_invoices.invoice_account_id",
    i.address as "billing_invoices.address",
    i.invoice_account_number as "billing_invoices.invoice_account_number",
    i.net_amount as "billing_invoices.net_amount",
    i.is_credit as "billing_invoices.is_credit",
    i.date_created as "billing_invoices.date_created",
    i.date_updated as "billing_invoices.date_updated",

    il.billing_invoice_licence_id as "billing_invoice_licences.billing_invoice_licence_id",
    il.company_id as "billing_invoice_licences.company_id",
    il.contact_id as "billing_invoice_licences.contact_id",
    il.address_id as "billing_invoice_licences.address_id",
    il.licence_ref as "billing_invoice_licences.licence_ref",
    il.licence_id as "billing_invoice_licences.licence_id"

  from water.billing_invoices i

    join water.billing_invoice_licences il
      on il.billing_invoice_id = i.billing_invoice_id

  where i.billing_batch_id = $1;
`

const getInvoiceDetailQuery = `
  select

    i.billing_invoice_id as "invoices.billing_invoice_id",
    i.invoice_account_id as "invoices.invoice_account_id",
    i.address as "invoices.address",
    i.invoice_account_number as "invoices.invoice_account_number",
    i.net_amount as "invoices.net_amount",
    i.is_credit as "invoices.is_credit",
    i.date_created as "invoices.date_created",

    il.billing_invoice_licence_id as "invoice_licence.billing_invoice_licence_id",
    il.billing_invoice_id as "invoice_licence.billing_invoice_id",
    il.company_id as "invoice_licence.company_id",
    il.contact_id as "invoice_licence.contact_id",
    il.address_id as "invoice_licence.address_id",
    il.licence_ref as "invoice_licence.licence_ref",
    il.licence_holder_name as "invoice_licence.licence_holder_name",
    il.licence_holder_address as "invoice_licence.licence_holder_address",
    il.licence_id as "invoice_licence.licence_id",

    t.billing_transaction_id as "transactions.billing_transaction_id",
    t.billing_invoice_licence_id as "transactions.billing_invoice_licence_id",
    t.charge_element_id as "transactions.charge_element_id",
    t.start_date as "transactions.start_date",
    t.end_date as "transactions.end_date",
    t.abstraction_period as "transactions.abstraction_period",
    t.source as "transactions.source",
    t.source_value as "transactions.source_value",
    t.season as "transactions.season",
    t.season_value as "transactions.season_value",
    t.loss as "transactions.loss",
    t.loss_value as "transactions.loss_value",
    t.net_amount as "transactions.net_amount",
    t.is_credit as "transactions.is_credit",
    t.charge_type as "transactions.charge_type",
    t.authorised_quantity as "transactions.authorised_quantity",
    t.billable_quantity as "transactions.billable_quantity",
    t.authorised_days as "transactions.authorised_days",
    t.billable_days as "transactions.billable_days",
    t.status as "transactions.status",
    t.description as "transactions.description"

  from water.billing_invoices i
    join water.billing_invoice_licences il
      on i.billing_invoice_id = il.billing_invoice_id
    join water.billing_transactions t
      on il.billing_invoice_licence_id = t.billing_invoice_licence_id
  where i.billing_invoice_id = $1;
`

const findOneByTransactionIdQuery = `
  select i.*
  from water.billing_transactions t
    join water.billing_invoice_licences il on t.billing_invoice_licence_id=il.billing_invoice_licence_id
    join water.billing_invoices i on il.billing_invoice_id=i.billing_invoice_id
  where t.billing_transaction_id=$1;
`

/**
 * Given a row of data from the data, return an object containing only
 * the keys that start with the prefix, but with the prefix removed.
 *
 * e.g.
 *
 * const test = { 'one.value': 1, 'two.value': 2}
 * filterByKeyPrefix(test, 'one.') --> { value: 1 }
 *
 * @param {Object} row A row of data from the database
 * @param {String} prefix The prefix that indicates data will be copied to an object
 */
const filterByKeyPrefix = (row, prefix) => {
  return Object.entries(row).reduce((acc, pair) => {
    const [key, value] = pair

    if (key.startsWith(prefix)) {
      acc[key.replace(prefix, '')] = value
    }
    return acc
  }, {})
}

const mapRowToInvoice = row => filterByKeyPrefix(row, 'invoices.')
const mapRowToLicence = row => filterByKeyPrefix(row, 'invoice_licence.')
const mapRowToTransaction = row => filterByKeyPrefix(row, 'transactions.')

class BillingInvoiceRepository extends Repository {
  constructor (config = {}) {
    super(Object.assign({
      connection: db.pool,
      table: 'water.billing_invoices',
      primaryKey: 'billing_invoice_id',
      upsert: {
        fields: ['billing_batch_id', 'invoice_account_id'],
        set: ['date_updated']
      }
    }, config))
  }

  async findByBatchId (batchId) {
    const { rows } = await this.dbQuery(findByBatchIdQuery, [batchId])
    return rows
  };

  async getInvoiceDetail (invoiceId) {
    const { rows } = await this.dbQuery(getInvoiceDetailQuery, [invoiceId])

    // turn the row data into a nested object with shape:
    // invoice = {
    //   licences: [
    //     { transactions: [] },
    //     { transactions: [] }
    //   ]
    // }
    return rows.reduce((acc, row) => {
      const invoice = acc || mapRowToInvoice(row)
      invoice.licences = invoice.licences || []

      // the same licence may appear on muliple results rows
      let licence = invoice.licences.find(l => l.licence_id === row['invoice_licence.licence_id'])

      if (!licence) {
        licence = mapRowToLicence(row)
        invoice.licences.push(licence)
      }

      // the transaction is unique so can be added straight to the licence
      licence.transactions = licence.transactions || []
      licence.transactions.push(mapRowToTransaction(row))

      return invoice
    }, null)
  }

  /**
   * Find a single invoice by transaction ID that references it
   * @param {String} transactionId
   * @return {Promise<Object>}
   */
  async findOneByTransactionId (transactionId) {
    const result = await this.dbQuery(findOneByTransactionIdQuery, [transactionId])
    return get(result, 'rows.0', null)
  }
}

module.exports = BillingInvoiceRepository
module.exports._findOneByTransactionIdQuery = findOneByTransactionIdQuery
