'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const syncSupportedSourcesJob = require('../../../../src/modules/billing/jobs/sync-supported-sources')

// Connectors
const applicationStateService = require('../../../../src/lib/services/application-state')
const s3Connector = require('../../../../src/lib/services/s3')

// Mappers
const supportedSourcesMapper = require('../../../../src/lib/mappers/supported-source')

// Repos
const supportedSourcesRepo = require('../../../../src/lib/connectors/repos/supported-sources')

const { logger } = require('../../../../src/logger')

experiment('modules/billing/jobs/sync-supported-sources', () => {
  const tempInvoiceAccountId = uuid()
  beforeEach(async () => {
    sandbox.restore()
    sandbox.spy(supportedSourcesMapper, 'csvToModel')
    sandbox.stub(logger, 'info')
    sandbox.stub(logger, 'error')
    sandbox.stub(applicationStateService, 'get').resolves({ data: { etag: 'crumpets' } })
    sandbox.stub(applicationStateService, 'save').resolves()
    sandbox.stub(s3Connector, 'getObject').resolves({
      Body: 'name,reference,order,region\nCandover,SS.1.1,16,Southern',
      ETag: 'butter'
    })
    sandbox.stub(supportedSourcesRepo, 'findOneByReference').resolves({
      reference: 'SS.1.1',
      name: 'Candover',
      order: null,
      region: null
    })
    sandbox.stub(supportedSourcesRepo, 'updateByReference').resolves()
    sandbox.stub(supportedSourcesRepo, 'create').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(syncSupportedSourcesJob.jobName).to.equal('billing.supported-sources.sync-from-csv')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = syncSupportedSourcesJob.createMessage(
        tempInvoiceAccountId
      )
      expect(message[0]).to.equal('billing.supported-sources.sync-from-csv')
      expect(message[1]).to.equal({})
      expect(message[2].jobId).to.startWith('billing.supported-sources.sync-from-csv.20')
      expect(message[2].repeat).to.exist()
    })
  })

  experiment('.handler', () => {
    beforeEach(async () => {
      await syncSupportedSourcesJob.handler()
    })

    test('logs a message to inform the terminal that the process has begun', () => {
      expect(logger.info.called).to.be.true()
    })

    experiment('When the ETag is different', () => {
      beforeEach(() => {
        applicationStateService.get.resolves({ data: { etag: 'crumpets' } })
      })
      test('maps each row from the CSV using the mapper', async () => {
        expect(supportedSourcesMapper.csvToModel.called).to.be.true()
      })

      experiment('when the reference already exists', () => {
        beforeEach(async () => {
          await supportedSourcesRepo.findOneByReference.resolves({
            reference: 'SS.1.1',
            name: 'Candover',
            order: 1,
            region: 'Southern'
          })
          await syncSupportedSourcesJob.handler()
        })
        test('it logs a message', () => {
          expect(logger.info.calledWith('Updating an existing supported source: SS.1.1')).to.be.true()
        })
        test('it calls the update repo method', () => {
          expect(supportedSourcesRepo.updateByReference.called).to.be.true()
          expect(supportedSourcesRepo.create.called).to.be.false()
        })
      })

      experiment('when the reference does not already exist', () => {
        beforeEach(async () => {
          await supportedSourcesRepo.findOneByReference.resolves(null)

          await syncSupportedSourcesJob.handler()
        })
        test('it logs a message', () => {
          expect(logger.info.calledWith('Creating a new supported source: SS.1.1')).to.be.true()
        })
        test('it calls the create repo method', () => {
          expect(supportedSourcesRepo.create.called).to.be.true()
        })
      })
    })

    experiment('When the ETag is the same', () => {
      beforeEach(async () => {
        await applicationStateService.get.resolves({ data: { etag: 'butter' } })
        await syncSupportedSourcesJob.handler()
      })
      test('informs the terminal via the logger that the file will not be processed', () => {
        expect(logger.info.calledWith('No change detected. Not processing file.')).to.be.true()
      })
    })
  })

  experiment('.onComplete', () => {
    beforeEach(async () => {
      await syncSupportedSourcesJob.onComplete()
    })

    test('an info message is logged', async () => {
      expect(logger.info.calledWith('billing.supported-sources.sync-from-csv: Job has completed')).to.be.true()
    })
  })

  experiment('.onFailed', () => {
    const error = new Error('Some error')
    beforeEach(async () => {
      await syncSupportedSourcesJob.onFailed({}, error)
    })

    test('an error message is logged', async () => {
      expect(logger.error.calledWith('billing.supported-sources.sync-from-csv: Job has failed', error)).to.be.true()
    })
  })
})
