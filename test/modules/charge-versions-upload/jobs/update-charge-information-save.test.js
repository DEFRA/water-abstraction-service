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
const licenceService = require('../../../../src/lib/services/licences')
const chargeVersionService = require('../../../../src/lib/services/charge-versions')
const chargeInformationSaveJob = require('../../../../src/modules/charge-versions-upload/jobs/update-charge-information-save')
const chargeVersionMapper = require('../../../../src/lib/mappers/charge-version')
const userMapper = require('../../../../src/lib/mappers/user')
const csvAdapter = require('../../../../src/modules/charge-versions-upload/lib/csv-adapter')
const { v4: uuid } = require('uuid')
const Event = require('../../../../src/lib/models/event')
const { usersClient } = require('../../../../src/lib/connectors/idm')
const s3 = require('../../../../src/lib/services/s3')
const saveJsonHelper = require('../../../../src/modules/charge-versions-upload/save-json')

const eventId = uuid()
const filename = 'test-file.csv'
const jobName = 'update-charge-information-save'

experiment('modules/charge-versions/jobs/update-charge-information-save', () => {
  let event, json, licence

  beforeEach(async () => {
    sandbox.stub(logger, 'info')
    sandbox.stub(logger, 'error')

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

    licence = {
      id: uuid(),
      licenceNumber: 'TEST/LICENCE'
    }

    sandbox.stub(s3, 'getObject').resolves({ Body: '[{"licenceRef":"TEST/LICENCE"}]' })
    sandbox.stub(s3, 'upload').resolves({})

    sandbox.stub(saveJsonHelper, 'saveJson')
    sandbox.stub(csvAdapter, 'mapper').resolves(json)

    sandbox.stub(licenceService, 'getLicenceByLicenceRef').resolves(licence)
    sandbox.stub(chargeVersionService, 'create').resolves({})
    sandbox.stub(chargeVersionMapper, 'pojoToModel').returns({ fromHash: (data) => data })
    sandbox.stub(userMapper, 'pojoToModel').returns({ fromHash: (data) => data })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(chargeInformationSaveJob.jobName).to.equal(jobName)
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = chargeInformationSaveJob.createMessage({ eventId })
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

    test('result contains metadata', async () => {
      const result = await chargeInformationSaveJob.handler(job)
      const statusMessage = '0 charge versions remaining to save'
      expect(result.metadata).to.equal({ filename, statusMessage })
    })
  })
})
