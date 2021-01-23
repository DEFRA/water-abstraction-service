'use strict';
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const BookshelfAdapter = require('./fixture-loader/adapters/BookshelfAdapter');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const urlJoin = require('url-join');
const createCrmUrl = (...parts) => urlJoin(config.services.crm_v2, ...parts);

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

// Create Bookshelf fixture loader
const bookshelfAdapter = new BookshelfAdapter(bookshelf);
const bookshelfLoader = new FixtureLoader(bookshelfAdapter, dir);

// Create CRM fixture loader
const crmAdapter = new AsyncAdapter();
crmAdapter
  .add('Company', body => serviceRequest.post(createCrmUrl('companies'), { body }))
  .add('Address', body => serviceRequest.post(createCrmUrl('addresses'), { body }))
  .add('CompanyAddress', ({ companyId, ...body }) => serviceRequest.post(createCrmUrl('companies', companyId, 'addresses'), { body }))
  .add('Document', body => serviceRequest.post(createCrmUrl('documents'), { body }))
  .add('Contact', body => serviceRequest.post(createCrmUrl('contacts'), { body }))
  .add('DocumentRole', ({ documentId, ...body }) => serviceRequest.post(createCrmUrl('documents', documentId, 'roles'), { body }))
  .add('InvoiceAccount', body => serviceRequest.post(createCrmUrl('invoice-accounts'), { body }))
  .add('InvoiceAccountAddress', ({ invoiceAccountId, ...body }) => serviceRequest.post(createCrmUrl('invoice-accounts', invoiceAccountId, 'addresses'), { body }));

const crmLoader = new FixtureLoader(crmAdapter, dir);

const func = async () => {
  try {
    // await bookshelfLoader.load('licence.yaml');

    await crmLoader.load('crm.yaml');
  } catch (err) {
    console.error(err);
  }
};

func();
