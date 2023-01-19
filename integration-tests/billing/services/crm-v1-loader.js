'use strict'

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter')

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const urlJoin = require('url-join')

const createCrmV1Url = (...parts) => urlJoin(config.services.crm, ...parts)

// Resolve path to fixtures directory
const path = require('path')
const dir = path.resolve(__dirname, '../fixtures')
const omit = (obj, props) => {
  obj = { ...obj }
  delete obj[props]
  return obj
}

const create = () => {
  // Create CRM fixture loader
  const asyncAdapter = new AsyncAdapter()
  asyncAdapter
    .add('DocumentHeader', body => serviceRequest.post(createCrmV1Url('documentHeader'), {
      body: {
        metadata: body.metadata ? JSON.stringify(body.metadata) : null,
        ...omit(body, ['metadata'])
      }
    }))
    .add('Entity', async body => {
      await serviceRequest.post(createCrmV1Url('entity'), { body })
      const response = await serviceRequest.get(createCrmV1Url(`entity?filter={"entity_nm": "${body.entity_nm}"}`))
      return response.data[0]
    })
    .add('EntityRole', ({
      entityId,
      ...body
    }) => serviceRequest.post(createCrmV1Url(`entity/${entityId}/roles`), { body }))

  return new FixtureLoader(asyncAdapter, dir)
}

module.exports = create
