'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const urlJoin = require('url-join');
const createCrmUrl = (...parts) => urlJoin(config.services.crm_v2, ...parts);

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = () => {
// Create CRM fixture loader
  const asyncAdapter = new AsyncAdapter();
  asyncAdapter
    .add('Company', body => serviceRequest.post(createCrmUrl('companies'), { body }))
    .add('Address', body => serviceRequest.post(createCrmUrl('addresses'), { body }))
    .add('CompanyAddress', ({ companyId, ...body }) => serviceRequest.post(createCrmUrl('companies', companyId, 'addresses'), { body }))
    .add('Document', body => serviceRequest.post(createCrmUrl('documents'), { body }))
    .add('Contact', body => serviceRequest.post(createCrmUrl('contacts'), { body }))
    .add('DocumentRole', ({ documentId, ...body }) => serviceRequest.post(createCrmUrl('documents', documentId, 'roles'), { body }))
    .add('InvoiceAccount', body => serviceRequest.post(createCrmUrl('invoice-accounts'), { body }))
    .add('InvoiceAccountAddress', ({ invoiceAccountId, ...body }) => serviceRequest.post(createCrmUrl('invoice-accounts', invoiceAccountId, 'addresses'), { body }));
  return new FixtureLoader(asyncAdapter, dir);
};

module.exports = create;
