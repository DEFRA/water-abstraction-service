'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const { logger } = require('../../../../src/logger')
const eventsService = require('../../../../src/lib/services/events')
const mapToJsonJob = require('../../../../src/modules/charge-versions-upload/jobs/update-charge-information-to-json')
const csvAdapter = require('../../../../src/modules/charge-versions-upload/lib/csv-adapter')
const { v4: uuid } = require('uuid')
const Event = require('../../../../src/lib/models/event')
const { usersClient } = require('../../../../src/lib/connectors/idm')
const s3 = require('../../../../src/lib/services/s3')

const eventId = uuid()
const filename = 'test-file.csv'
const jobName = 'charge-information-upload-to-json'

experiment('modules/charge-versions/jobs/update-charge-information-to-json', () => {
  let event, json

  beforeEach(async () => {
    sandbox.stub(logger)

    event = new Event()
    event.fromHash({
      id: eventId,
      subtype: 'csv',
      metadata: { filename }
    })

    sandbox.stub(eventsService, 'findOne').resolves(event)
    sandbox.stub(eventsService, 'update').resolves(event)
    sandbox.stub(eventsService, 'updateStatus').resolves(event)

    sandbox.stub(usersClient, 'getUserByUsername').resolves({
      user_name: 'test-job@example.com'
    })

    json = [
      { header1: 'col1', header2: 'col2' },
      { header1: 'col1', header2: 'col2' }
    ]

    sandbox.stub(s3, 'getObject').resolves({ Body: 'header1, header2\ncol1, col2\ncol1, col2' })
    sandbox.stub(s3, 'upload').resolves({})

    sandbox.stub(csvAdapter, 'mapper').resolves(json)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(mapToJsonJob.jobName).to.equal(jobName)
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = mapToJsonJob.createMessage({ eventId })
      expect(message).to.equal([
        jobName,
        { eventId },
        { jobId: `${jobName}.${eventId}` }
      ])
    })
  })

  experiment('.handler', () => {
    let job

    beforeEach(async () => {
      job = {
        id: uuid(),
        data: { eventId }
      }
    })

    test('upload filename and buffer', async () => {
      await mapToJsonJob.handler(job)
      const [jsonFilename, buffer] = s3.upload.lastCall.args
      expect(JSON.parse(buffer.toString())).to.equal(json)
      expect(jsonFilename).to.contain(filename.replace('.csv', '.json'))
    })

    test('result contains metadata', async () => {
      const result = await mapToJsonJob.handler(job)
      expect(result.metadata).to.equal({ filename })
    })
  })
})
