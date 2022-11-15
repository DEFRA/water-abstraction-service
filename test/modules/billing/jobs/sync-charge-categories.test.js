'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const syncChargeCategoriesJob = require('../../../../src/modules/billing/jobs/sync-charge-categories')

// Connectors
const applicationStateService = require('../../../../src/lib/services/application-state')
const s3Connector = require('../../../../src/lib/services/s3')

// Mappers
const chargeCategoriesMapper = require('../../../../src/lib/mappers/charge-category')

// Repos
const chargeCategoriesRepo = require('../../../../src/lib/connectors/repos/charge-categories')

const { logger } = require('../../../../src/logger')

experiment('modules/billing/jobs/sync-charge-categories', () => {
  const tempInvoiceAccountId = uuid()
  beforeEach(async () => {
    sandbox.restore()
    sandbox.spy(chargeCategoriesMapper, 'csvToModel')
    sandbox.stub(logger, 'info')
    sandbox.stub(logger, 'error')
    sandbox.stub(applicationStateService, 'get').resolves({ data: { etag: 'crumpets' } })
    sandbox.stub(applicationStateService, 'save').resolves()
    sandbox.stub(s3Connector, 'getObject').resolves({
      Body: 'reference,description,subsistence_charge,short_description\ncat1,a very long description,100,short description',
      ETag: 'butter'
    })
    sandbox.stub(chargeCategoriesRepo, 'findOneByReference').resolves({
      reference: 'cat1',
      description: 'Some Description',
      shortDescription: 'Some Description',
      subsistenceCharge: 100
    })
    sandbox.stub(chargeCategoriesRepo, 'updateByReference').resolves()
    sandbox.stub(chargeCategoriesRepo, 'create').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('exports the expected job name', async () => {
    expect(syncChargeCategoriesJob.jobName).to.equal('billing.charge-categories.sync-from-csv')
  })

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = syncChargeCategoriesJob.createMessage(
        tempInvoiceAccountId
      )
      expect(message[0]).to.equal('billing.charge-categories.sync-from-csv')
      expect(message[1]).to.equal({})
      expect(message[2].jobId).to.startWith('billing.charge-categories.sync-from-csv.20')
      expect(message[2].repeat).to.exist()
    })
  })

  experiment('.handler', () => {
    beforeEach(async () => {
      await syncChargeCategoriesJob.handler()
    })

    test('logs a message to inform the terminal that the process has begun', () => {
      expect(logger.info.called).to.be.true()
    })

    experiment('When the ETag is different', () => {
      beforeEach(() => {
        applicationStateService.get.resolves({ data: { etag: 'crumpets' } })
      })
      test('maps each row from the CSV using the mapper', async () => {
        expect(chargeCategoriesMapper.csvToModel.called).to.be.true()
      })

      experiment('when the reference already exists', () => {
        beforeEach(async () => {
          await chargeCategoriesRepo.findOneByReference.resolves({
            reference: 'cat1',
            description: 'Some Description',
            shortDescription: 'Some Description',
            subsistenceCharge: 100
          })
          await syncChargeCategoriesJob.handler()
        })
        test('it logs a message', () => {
          expect(logger.info.calledWith('Updating an existing charge category: cat1')).to.be.true()
        })
        test('it calls the update repo method', () => {
          expect(chargeCategoriesRepo.updateByReference.called).to.be.true()
          expect(chargeCategoriesRepo.create.called).to.be.false()
        })
      })

      experiment('when the reference does not already exist', () => {
        beforeEach(async () => {
          await chargeCategoriesRepo.findOneByReference.resolves(null)

          await syncChargeCategoriesJob.handler()
        })
        test('it logs a message', () => {
          expect(logger.info.calledWith('Creating a new charge category: cat1')).to.be.true()
        })
        test('it calls the create repo method', () => {
          expect(chargeCategoriesRepo.create.called).to.be.true()
        })
      })
    })

    experiment('When the ETag is the same', () => {
      beforeEach(async () => {
        await applicationStateService.get.resolves({ data: { etag: 'butter' } })
        await syncChargeCategoriesJob.handler()
      })
      test('informs the terminal via the logger that the file will not be processed', () => {
        expect(logger.info.calledWith('No change detected. Not processing file.')).to.be.true()
      })
    })
  })

  experiment('.onComplete', () => {
    beforeEach(async () => {
      await syncChargeCategoriesJob.onComplete()
    })

    test('an info message is logged', async () => {
      expect(logger.info.calledWith('billing.charge-categories.sync-from-csv: Job has completed')).to.be.true()
    })
  })

  experiment('.onFailed', () => {
    const error = new Error('Some error')
    beforeEach(async () => {
      await syncChargeCategoriesJob.onFailed({}, error)
    })

    test('an error message is logged', async () => {
      expect(logger.error.calledWith('billing.charge-categories.sync-from-csv: Job has failed', error.stack)).to.be.true()
    })
  })
})
