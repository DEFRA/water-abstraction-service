'use strict'

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter')

const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const createPermitsUrl = (...parts) => urlJoin(config.services.permits, ...parts)
const { getLicenceData } = require('./permit-helpers')
// Resolve path to fixtures directory
const path = require('path')
const dir = path.resolve(__dirname, '../fixtures')
const moment = require('moment')

const create = () => {
  // Create IDM fixture loader
  const asyncAdapter = new AsyncAdapter()

  asyncAdapter
    .add('Licence', async (body) => {
      const newPermit = await serviceRequest.post(createPermitsUrl('licence'), {
        body: {
          licence_status_id: 1,
          licence_type_id: 8,
          licence_regime_id: 1,
          licence_start_dt: body.startDate,
          licence_ref: body.licenceRef,
          licence_data_value: JSON.stringify(getLicenceData(body.licenceRef, moment(body.startDate), moment(body.startDate).add(1, 'year'))),
          metadata: JSON.stringify({ source: 'acceptance-test-setup' })
        }
      })
      return newPermit.data
    })

  return new FixtureLoader(asyncAdapter, dir)
}

module.exports = create
