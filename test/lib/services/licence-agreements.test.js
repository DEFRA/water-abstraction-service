'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const sandbox = require('sinon').createSandbox()

const errors = require('../../../src/lib/errors')

// Services
const agreementsService = require('../../../src/lib/services/agreements')
const licenceService = require('../../../src/lib/services/licences')
const licenceAgreementsService = require('../../../src/lib/services/licence-agreements')
const eventsService = require('../../../src/lib/services/events')
const service = require('../../../src/lib/services/service')

// Mappers
const licenceAgreementMapper = require('../../../src/lib/mappers/licence-agreement')

// Repos
const licenceAgreementRepo = require('../../../src/lib/connectors/repos/licence-agreements')

// Models
const User = require('../../../src/lib/models/user')
const DateRange = require('../../../src/lib/models/date-range')
const Licence = require('../../../src/lib/models/licence')
const LicenceAgreement = require('../../../src/lib/models/licence-agreement')
const Agreement = require('../../../src/lib/models/agreement')
const licenceAgreementId = uuid()
const createTestUser = () => new User(123, 'joan.doe@example.com')
const createTestLicence = () => new Licence(uuid()).fromHash({
  licenceNumber: '01/123/ABC'
})
const createTestLicenceAgreement = (startDate = '2020-01-01') => {
  const dateRange = new DateRange(startDate)
  return new LicenceAgreement(licenceAgreementId).fromHash({
    licenceNumber: '01/123/ABC',
    dateRange
  })
}
const createTestAgreement = () => new Agreement(uuid()).fromHash({
  code: 'S127'
})

experiment('src/lib/services/licence-agreements', () => {
  beforeEach(async () => {
    sandbox.stub(agreementsService, 'getAgreementByCode')

    sandbox.stub(licenceService, 'flagForSupplementaryBilling')
    sandbox.stub(licenceService, 'getLicenceByLicenceRef')

    sandbox.stub(eventsService, 'create')

    sandbox.stub(service, 'findOne')
    sandbox.stub(service, 'findMany')

    sandbox.stub(licenceAgreementRepo, 'softDeleteOne')
    sandbox.stub(licenceAgreementRepo, 'create')
    sandbox.stub(licenceAgreementRepo, 'update')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getLicenceAgreementsByLicenceRef', () => {
    test('delegates to service.findMany', async () => {
      await licenceAgreementsService.getLicenceAgreementsByLicenceRef('123/123')
      expect(service.findMany.calledWith(
        '123/123',
        licenceAgreementRepo.findByLicenceRef,
        licenceAgreementMapper
      )).to.be.true()
    })
  })

  experiment('.getLicenceAgreementById', () => {
    const licenceAgreementId = uuid()

    test('delegates to service.findOne', async () => {
      await licenceAgreementsService.getLicenceAgreementById(licenceAgreementId)
      expect(service.findOne.calledWith(
        licenceAgreementId,
        licenceAgreementRepo.findOne,
        licenceAgreementMapper
      )).to.be.true()
    })
  })

  experiment('.patchLicenceAgreement', () => {
    experiment('when the licence agreement is not found', () => {
      const tempLicenceId = uuid()
      beforeEach(async () => {
        service.findOne.resolves(null)
        licenceAgreementRepo.update.returns({ licence: { licenceId: tempLicenceId } })
      })
      test('a NotFoundError is thrown', async () => {
        const func = () => licenceAgreementsService.patchLicenceAgreement(licenceAgreementId)
        const err = await expect(func()).to.reject()
        expect(err).to.be.an.instanceof(errors.NotFoundError)
        expect(err.message).to.equal(`Licence agreement ${licenceAgreementId} not found`)
      })
    })

    experiment('when the licence agreement is found and the licence agreement is pre-SROC', () => {
      const tempLicenceId = uuid()
      let licenceAgreement, user, licence

      beforeEach(async () => {
        licenceAgreement = createTestLicenceAgreement('2020-01-01')
        service.findOne.resolves(licenceAgreement)
        licenceAgreementRepo.update.returns({ licence: { licenceId: tempLicenceId } })
        user = createTestUser()
        licence = createTestLicence()
        licenceService.getLicenceByLicenceRef.resolves(licence)
        await licenceAgreementsService.patchLicenceAgreement(licenceAgreementId, { endDate: '2020-01-01' }, user)
      })

      test('the record is updated', async () => {
        expect(licenceAgreementRepo.update.calledWith(
          licenceAgreementId,
          {
            endDate: '2020-01-01'
          }
        )).to.be.true()
      })

      test('an event is persisted', async () => {
        const [event] = eventsService.create.lastCall.args
        expect(event.licences).to.equal([licence.licenceNumber])
        expect(event.issuer).to.equal(user.email)
        expect(event.type).to.equal('licence-agreement:update')
        expect(event.status).to.equal('updated')
        expect(event.metadata.id).to.equal(licenceAgreementId)
      })

      test('the licence is flagged for supplementary billing', async () => {
        expect(licenceService.flagForSupplementaryBilling.calledWith(
          tempLicenceId
        )).to.be.true()
      })
    })
  })

  experiment('.deleteLicenceAgreementById', () => {
    experiment('when the licence agreement is not found', () => {
      beforeEach(async () => {
        service.findOne.resolves(null)
      })

      test('a NotFoundError is thrown', async () => {
        const func = () => licenceAgreementsService.deleteLicenceAgreementById(licenceAgreementId)
        const err = await expect(func()).to.reject()
        expect(err).to.be.an.instanceof(errors.NotFoundError)
        expect(err.message).to.equal(`Licence agreement ${licenceAgreementId} not found`)
      })
    })

    experiment('when the licence agreement is found', () => {
      let licenceAgreement, user, licence

      beforeEach(async () => {
        licenceAgreement = createTestLicenceAgreement()
        service.findOne.resolves(licenceAgreement)

        user = createTestUser()

        licence = createTestLicence()
        licenceService.getLicenceByLicenceRef.resolves(licence)

        await licenceAgreementsService.deleteLicenceAgreementById(licenceAgreementId, user)
      })

      test('the record is deleted', async () => {
        expect(licenceAgreementRepo.softDeleteOne.calledWith(
          licenceAgreementId
        )).to.be.true()
      })

      test('an event is persisted', async () => {
        const [event] = eventsService.create.lastCall.args
        expect(event.licences).to.equal([licence.licenceNumber])
        expect(event.issuer).to.equal(user.email)
        expect(event.type).to.equal('licence-agreement:delete')
        expect(event.status).to.equal('deleted')
        expect(event.metadata.id).to.equal(licenceAgreementId)
      })

      test('the licence is flagged for supplementary billing', async () => {
        expect(licenceService.flagForSupplementaryBilling.calledWith(
          licence.id
        )).to.be.true()
      })
    })
  })

  experiment('.createLicenceAgreement', () => {
    let licence, user, agreement, result

    beforeEach(async () => {
      licence = createTestLicence()
      user = createTestUser()
      agreement = createTestAgreement()

      agreementsService.getAgreementByCode.resolves(agreement)

      licenceAgreementRepo.create.resolves({
        licenceAgreementId
      })
    })

    experiment('when the agreement type is found', () => {
      beforeEach(async () => {
        result = await licenceAgreementsService.createLicenceAgreement(
          licence,
          {
            code: 'S127',
            startDate: '2019-04-01',
            dateSigned: '2019-05-03'
          },
          user
        )
      })

      test('loads the agreement by id', async () => {
        expect(agreementsService.getAgreementByCode.calledWith(
          'S127'
        )).to.be.true()
      })

      test('persists the data', async () => {
        const [data] = licenceAgreementRepo.create.lastCall.args

        expect(data.licenceRef).to.equal(licence.licenceNumber)
        expect(data.startDate).to.equal('2019-04-01')
        expect(data.dateSigned).to.equal('2019-05-03')
        expect(data.financialAgreementTypeId).to.equal(agreement.id)
      })

      test('an event is persisted', async () => {
        const [event] = eventsService.create.lastCall.args
        expect(event.licences).to.equal([licence.licenceNumber])
        expect(event.issuer).to.equal(user.email)
        expect(event.type).to.equal('licence-agreement:create')
        expect(event.status).to.equal('created')
        expect(event.metadata.id).to.equal(licenceAgreementId)
      })

      test('the licence is flagged for supplementary billing', async () => {
        expect(licenceService.flagForSupplementaryBilling.calledWith(
          licence.id
        )).to.be.true()
      })

      test('resolves with a new licence agreement model', async () => {
        expect(result).to.be.an.instanceof(LicenceAgreement)
        expect(result.id).to.equal(licenceAgreementId)
        expect(result.licenceNumber).to.equal(licence.licenceNumber)
        expect(result.agreement.code).to.equal('S127')
        expect(result.dateRange.startDate).to.equal('2019-04-01')
        expect(result.dateSigned).to.equal('2019-05-03')
      })
    })

    experiment('when the agreement type is not found', () => {
      beforeEach(async () => {
        agreementsService.getAgreementByCode.resolves(null)
      })

      test('rejects with a NotFoundError', async () => {
        const func = () => licenceAgreementsService.createLicenceAgreement(
          licence,
          {
            code: 'S127',
            startDate: '2019-04-01',
            dateSigned: '2019-05-03'
          },
          user
        )

        const err = await expect(func()).to.reject()
        expect(err).to.be.an.instanceof(errors.NotFoundError)
      })
    })

    experiment('when there is a unique constraint violation', () => {
      beforeEach(async () => {
        const err = new Error('DB error')
        err.code = '23505'
        licenceAgreementRepo.create.rejects(err)
      })

      test('rejects with a ConflictingDataError', async () => {
        const func = () => licenceAgreementsService.createLicenceAgreement(
          licence,
          {
            code: 'S127',
            startDate: '2019-04-01',
            dateSigned: '2019-05-03'
          },
          user
        )

        const err = await expect(func()).to.reject()
        expect(err).to.be.an.instanceof(errors.ConflictingDataError)
      })
    })

    experiment('when there is an unexpected error', () => {
      let error

      beforeEach(async () => {
        error = new Error('DB error')
        licenceAgreementRepo.create.rejects(error)
      })

      test('the error is rethrown', async () => {
        const func = () => licenceAgreementsService.createLicenceAgreement(
          licence,
          {
            code: 'S127',
            startDate: '2019-04-01',
            dateSigned: '2019-05-03'
          },
          user
        )

        const err = await expect(func()).to.reject()
        expect(err).to.equal(error)
      })
    })
  })
})
