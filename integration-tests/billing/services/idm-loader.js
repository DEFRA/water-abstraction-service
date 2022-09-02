'use strict'

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter')

const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const createIdmUrl = (...parts) => urlJoin(config.services.idm, ...parts)

// Resolve path to fixtures directory
const path = require('path')
const dir = path.resolve(__dirname, '../fixtures')

const create = (sharedData) => {
// Create IDM fixture loader
  const asyncAdapter = new AsyncAdapter()

  asyncAdapter
    .add('User', async (body) => {
      const newUser = await serviceRequest.post(createIdmUrl('user'), { body })
      return newUser.data
    })
    .add('Roles', ({ userId, ...body }) => {
      const newRoles = serviceRequest.put(createIdmUrl(`user/${userId}/roles`), { body })
      return newRoles.data
    })

  return new FixtureLoader(asyncAdapter, dir)
}

module.exports = create
