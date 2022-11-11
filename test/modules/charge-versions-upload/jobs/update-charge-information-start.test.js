'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect, fail } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const { logger } = require('../../../../src/logger')
const eventsService = require('../../../../src/lib/services/events')
const startUploadJob = require('../../../../src/modules/charge-versions-upload/jobs/update-charge-information-start')
const csvAdapter = require('../../../../src/modules/charge-versions-upload/lib/csv-adapter')
const { v4: uuid } = require('uuid')
const Event = require('../../../../src/lib/models/event')
const { usersClient } = require('../../../../src/lib/connectors/idm')
const s3 = require('../../../../src/lib/services/s3')

const eventId = uuid()
const filename = 'test-file.csv'
const jobName = 'charge-information-upload-start'

experiment('modules/charge-versions/jobs/update-charge-information-start', () => {
  let event, csvData

  beforeEach(async () => {
    sandbox.stub(logger, 'info')
    sandbox.stub(logger, 'error')

    event = new Event()
    event.fromHash({
      id: eventId,
      subtype: 'csv',
      filename,
      metadata: { filename }
    })

    sandbox.stub(eventsService, 'findOne').resolves(event)
    sandbox.stub(eventsService, 'update').resolves(event)
    sandbox.stub(eventsService, 'updateStatus').resolves(event)

    sandbox.stub(csvAdapter, 'validator')

    sandbox.stub(usersClient, 'getUserByUsername').resolves({
      user_name: 'test-job@example.com'
    })

    csvData = 'header1, header2\ncol1, col2\ncol1, col2'

    sandbox.stub(s3, 'getObject').resolves({ Body: csvData })
    sandbox.stub(s3, 'upload').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(startUploadJob.jobName).to.equal(jobName)
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = startUploadJob.createMessage(event)
      expect(message).to.equal([
        jobName,
        { eventId, filename },
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

    test('when csv is valid', async () => {
      csvAdapter.validator.resolves({ isValid: true })
      await startUploadJob.handler(job)
      const { args } = csvAdapter.validator.lastCall
      expect(args[0]).to.equal(csvData)
    })

    test('when csv is invalid', async () => {
      csvAdapter.validator.resolves({ isValid: false, validationErrors: [] })
      try {
        await startUploadJob.handler(job)
        fail()
      } catch (err) {
        expect(err.key).to.equal('invalid-csv')
        expect(err.message).to.equal('Failed Schema Validation')
      }
    })
  })
})
