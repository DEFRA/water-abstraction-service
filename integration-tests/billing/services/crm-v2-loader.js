'use strict'

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter')

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const urlJoin = require('url-join')
const createCrmV2Url = (...parts) => urlJoin(config.services.crm_v2, ...parts)

// Resolve path to fixtures directory
const path = require('path')
const dir = path.resolve(__dirname, '../fixtures')

const create = () => {
// Create CRM fixture loader

  const asyncAdapter = new AsyncAdapter()
  asyncAdapter
    .add('Company', body => serviceRequest.post(createCrmV2Url('companies'), { body }))
    .add('Address', body => serviceRequest.post(createCrmV2Url('addresses'), { body }))
    .add('CompanyAddress', ({
      companyId,
      ...body
    }) => serviceRequest.post(createCrmV2Url('companies', companyId, 'addresses'), { body }))
    .add('Document', async body => {
      const response = await serviceRequest.post(createCrmV2Url('documents'), { body })
      return response
    })
    .add('Contact', body => serviceRequest.post(createCrmV2Url('contacts'), { body }))
    .add('DocumentRole', ({
      documentId,
      ...body
    }) => serviceRequest.post(createCrmV2Url('documents', documentId, 'roles'), { body }))
    .add('InvoiceAccount', body => serviceRequest.post(createCrmV2Url('invoice-accounts'), { body }))
    .add('InvoiceAccountAddress', ({
      invoiceAccountId,
      ...body
    }) => serviceRequest.post(createCrmV2Url('invoice-accounts', invoiceAccountId, 'addresses'), { body }))
    .add('CompanyContact', ({
      companyId,
      ...body
    }) => serviceRequest.post(createCrmV2Url('companies', companyId, 'contacts'), { body }))
  return new FixtureLoader(asyncAdapter, dir)
}

module.exports = create
