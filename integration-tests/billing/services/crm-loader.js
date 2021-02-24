'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const urlJoin = require('url-join');
const createCrmV2Url = (...parts) => urlJoin(config.services.crm_v2, ...parts);
const createCrmV1Url = (...parts) => urlJoin(config.services.crm, ...parts);

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = (sharedData) => {
// Create CRM fixture loader

  const asyncAdapter = new AsyncAdapter();
  asyncAdapter
    .add('Company', body => serviceRequest.post(createCrmV2Url('companies'), { body }))
    .add('Address', body => serviceRequest.post(createCrmV2Url('addresses'), { body }))
    .add('CompanyAddress', ({
      companyId,
      ...body
    }) => serviceRequest.post(createCrmV2Url('companies', companyId, 'addresses'), { body }))
    .add('Document', async body => {
      const response = await serviceRequest.post(createCrmV2Url('documents'), { body });

      sharedData.set(`v2doc-${body.documentRef}`, response);
      return response;
    })
    .add('DocumentHeader', body => serviceRequest.post(createCrmV1Url('documentHeader'), {
      body: {
        metadata: JSON.stringify({
          dataType: 'acceptance-test-setup',
          IsCurrent: true
        }),
        system_internal_id: sharedData.get(`permit-${body.system_external_id}`).licence_id,
        ...body
      }
    }))
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
    .add('Entity', async body => {
      await serviceRequest.post(createCrmV1Url('entity'), { body });
      const response = await serviceRequest.get(createCrmV1Url(`entity?filter={"entity_nm": "${body.entity_nm}"}`));
      return response.data[0];
    })
    .add('EntityRole', ({
      entityId,
      ...body
    }) => serviceRequest.post(createCrmV1Url(`entity/${entityId}/roles`), { body }))
    .add('CompanyContact', ({
      companyId,
      ...body
    }) => serviceRequest.post(createCrmV2Url('companies', companyId, 'contacts'), { body }));
  return new FixtureLoader(asyncAdapter, dir);
};

module.exports = create;
