const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { v4: uuid } = require('uuid')

const mapToJsonJob = require('../../../../../src/modules/returns/lib/jobs/map-to-json')
const { logger } = require('../../../../../src/logger')

const eventId = uuid()

experiment('map-to-json', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(logger, 'error').returns()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = mapToJsonJob.createMessage({ eventId })
    })

    test('creates a message with the expected name', async () => {
      expect(message[0]).to.equal(mapToJsonJob.jobName)
    })

    test('the message has the expected job data', async () => {
      expect(message[1]).to.equal({
        eventId,
        subtype: 'csv'
      })
    })
  })
})
