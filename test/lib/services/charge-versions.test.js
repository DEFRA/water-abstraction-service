'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { v4: uuid } = require('uuid')
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Services
const service = require('../../../src/lib/services/service')
const licencesService = require('../../../src/lib/services/licences')
const notesService = require('../../../src/lib/services/notes-service')
const chargeVersionService = require('../../../src/lib/services/charge-versions')
const chargeElementService = require('../../../src/lib/services/charge-elements')
const invoiceAccountsService = require('../../../src/lib/services/invoice-accounts-service')

// Models
const ChargeVersion = require('../../../src/lib/models/charge-version')
const ChargeElement = require('../../../src/lib/models/charge-element')
const DateRange = require('../../../src/lib/models/date-range')
const Licence = require('../../../src/lib/models/licence')
const Note = require('../../../src/lib/models/note')

// Repos
const chargeVersionRepo = require('../../../src/lib/connectors/repos/charge-versions')
const notesRepo = require('../../../src/lib/connectors/repos/notes')

// Mappers
const chargeVersionMapper = require('../../../src/lib/mappers/charge-version')

// Constants
const NOTE_ID = uuid()

const data = { test: 'test' }
const note = { test: 'note-data' }

experiment('lib/services/charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findOne').resolves(data)
    sandbox.stub(service, 'findMany').resolves([data])
    sandbox.stub(notesRepo, 'create').resolves({ noteId: NOTE_ID })
    sandbox.stub(chargeVersionRepo, 'create').resolves({})
    sandbox.stub(chargeVersionRepo, 'update')
    sandbox.stub(chargeVersionRepo, 'findMany')
    sandbox.stub(licencesService, 'getLicenceById').resolves({})
    sandbox.stub(notesService, 'decorateWithNote').resolves({ ...data, note })
    sandbox.stub(licencesService, 'flagForSupplementaryBilling')
    sandbox.stub(chargeElementService, 'create')
    sandbox.stub(invoiceAccountsService, 'decorateWithInvoiceAccount').resolves({
      id: 'test-charge-version-id',
      invoiceAccount: { id: 'test-invoice-account-id' }
    })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getByChargeVersionId', () => {
    test('delegates to the service.findOne function', async () => {
      const id = uuid()
      const result = await chargeVersionService.getByChargeVersionId(id)

      expect(result).to.equal(data)

      const [chargeVersionId, fetch, mapper] = service.findOne.lastCall.args
      expect(chargeVersionId).to.equal(id)
      expect(fetch).to.equal(chargeVersionRepo.findOne)
      expect(mapper).to.equal(chargeVersionMapper)
    })
  })

  experiment('.getManyByChargeVersionIds', () => {
    let ids, result
    beforeEach(async () => {
      ids = [uuid(), uuid()]
      chargeVersionRepo.findMany.resolves([
        { chargeVersionId: ids[0] },
        { chargeVersionId: ids[1] }])

      result = await chargeVersionService.getManyByChargeVersionIds(ids)
    })

    test('calls the .findMany repo function', async () => {
      expect(chargeVersionRepo.findMany.calledWith(ids)).to.be.true()
    })

    test('returns the result of the mapper', () => {
      expect(result).to.be.an.array().have.length(2)
      expect(result[0]).to.be.an.instanceOf(ChargeVersion)
      expect(result[0].id).to.equal(ids[0])
      expect(result[1]).to.be.an.instanceOf(ChargeVersion)
      expect(result[1].id).to.equal(ids[1])
    })
  })

  experiment('.getByLicenceId', () => {
    test('delegates to the service.findMany function', async () => {
      const result = await chargeVersionService.getByLicenceId('test-guid')

      expect(result).to.equal([{ ...data, note }])

      const [licenceRef, fetch, mapper] = service.findMany.lastCall.args
      expect(licenceRef).to.equal('test-guid')
      expect(fetch).to.equal(chargeVersionRepo.findByLicenceId)
      expect(mapper).to.equal(chargeVersionMapper)
    })
  })

  experiment('.getByLicenceRef', () => {
    test('delegates to the service.findMany function', async () => {
      const result = await chargeVersionService.getByLicenceRef('123/123')

      expect(result).to.equal([data])

      const [licenceRef, fetch, mapper] = service.findMany.lastCall.args
      expect(licenceRef).to.equal('123/123')
      expect(fetch).to.equal(chargeVersionRepo.findByLicenceRef)
      expect(mapper).to.equal(chargeVersionMapper)
    })
  })

  experiment('.getByIdWithInvoiceAccount', () => {
    let id, result
    beforeEach(async () => {
      id = uuid()
      service.findOne.resolves({ id: 'test-charge-version-id' })

      result = await chargeVersionService.getByIdWithInvoiceAccount(id)
    })

    test('delegates to the service.findOne function', async () => {
      const [chargeVersionId, fetch, mapper] = service.findOne.lastCall.args
      expect(chargeVersionId).to.equal(id)
      expect(fetch).to.equal(chargeVersionRepo.findOne)
      expect(mapper).to.equal(chargeVersionMapper)
    })

    test('calls the invoice account service with charge version', async () => {
      const [chargeVersion] = invoiceAccountsService.decorateWithInvoiceAccount.lastCall.args
      expect(chargeVersion).to.equal({ id: 'test-charge-version-id' })
    })

    test('returns the decorated charge version', async () => {
      expect(result.id).to.equal('test-charge-version-id')
      expect(result.invoiceAccount).to.equal({ id: 'test-invoice-account-id' })
    })
  })

  experiment('.create', () => {
    let chargeVersion, chargeElement, licence
    const chargeVersionId = uuid()

    beforeEach(async () => {
      chargeElement = new ChargeElement(uuid())
      licence = new Licence()
      licence.fromHash({
        id: uuid(),
        licenceNumber: '01/123/ABC'
      })

      chargeVersion = new ChargeVersion()

      chargeVersion.fromHash({
        dateRange: new DateRange('2020-01-01', null),
        status: 'current',
        chargeElements: [chargeElement],
        licence
      })

      chargeVersionRepo.create.resolves({
        chargeVersionId,
        scheme: 'alcs',
        versionNumber: 1,
        status: 'current',
        regionCode: 1,
        startDate: '2020-01-01',
        endDate: null,
        source: 'wrls',
        companyId: uuid(),
        invoiceAccountId: uuid()
      })

      chargeElementService.create.resolves(chargeElement)
    })

    experiment('when there are no existing charge versions', () => {
      beforeEach(async () => {
        service.findMany.resolves([])
        await chargeVersionService.create(chargeVersion)
      })

      test('existing charge versions for the same licence are fetched', async () => {
        const [licenceRef] = service.findMany.lastCall.args
        expect(licenceRef).to.equal(licence.licenceNumber)
      })

      test('the end date is unchanged', async () => {
        expect(chargeVersion.dateRange.endDate).to.be.null()
      })

      test('the charge version is persisted', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.licenceRef).to.equal(licence.licenceNumber)
        expect(data.versionNumber).to.equal(1)
        expect(data.startDate).to.equal('2020-01-01')
        expect(data.source).to.equal('wrls')
        expect(data.status).to.equal('current')
      })

      test('the charge elements are persisted', async () => {
        expect(chargeElementService.create.callCount).to.equal(1)
        const { args } = chargeElementService.create.lastCall
        expect(args[0].id).to.equal(chargeVersionId)
        expect(args[1]).to.equal(chargeElement)
      })

      test('no other charge versions are updated', async () => {
        expect(chargeVersionRepo.update.callCount).to.equal(0)
      })

      test('the charge version is loaded by ID and returned', async () => {
        expect(service.findOne.calledWith(chargeVersionId)).to.be.true()
      })
    })

    experiment('when the charge version has a note', () => {
      beforeEach(async () => {
        service.findMany.resolves([])
        const note = new Note()
        note.fromHash({ id: NOTE_ID, text: 'note text', typeId: uuid(), user: { id: 12345 } })
        chargeVersion.note = note
        await chargeVersionService.create(chargeVersion)
      })

      test('the charge version is updated with the note id', async () => {
        expect(chargeVersionRepo.update.callCount).to.equal(1)
        const { args } = chargeVersionRepo.update.lastCall
        expect(args).to.equal([chargeVersionId, { noteId: NOTE_ID }])
      })
    })

    experiment('when the new charge version is after an existing one', () => {
      let existingChargeVersion
      beforeEach(async () => {
        existingChargeVersion = new ChargeVersion()
        existingChargeVersion.fromHash({
          id: uuid(),
          dateRange: new DateRange('2019-01-01', null),
          status: 'current',
          versionNumber: 3
        })
        service.findMany.resolves([
          existingChargeVersion
        ])
        await chargeVersionService.create(chargeVersion)
      })

      test('the new charge version has the next version number', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.versionNumber).to.equal(4)
      })

      test('the end date of the new charge version is unchanged', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.endDate).to.be.null()
      })

      test('the existing charge version is updated', async () => {
        expect(chargeVersionRepo.update.callCount).to.equal(1)
        expect(chargeVersionRepo.update.calledWith(
          existingChargeVersion.id, { endDate: '2019-12-31', status: 'current' }
        ))
      })
    })

    experiment('when the new charge version is before an existing one', () => {
      let existingChargeVersion
      beforeEach(async () => {
        existingChargeVersion = new ChargeVersion()
        existingChargeVersion.fromHash({
          id: uuid(),
          dateRange: new DateRange('2021-01-01', null),
          status: 'current',
          versionNumber: 3
        })
        service.findMany.resolves([
          existingChargeVersion
        ])
        await chargeVersionService.create(chargeVersion)
      })

      test('the new charge version has the next version number', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.versionNumber).to.equal(4)
      })

      test('the end date of the new charge version is the day before the existing one starts', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.endDate).to.equal('2020-12-31')
      })

      test('the existing charge version is updated', async () => {
        expect(chargeVersionRepo.update.callCount).to.equal(1)
        expect(chargeVersionRepo.update.calledWith(
          existingChargeVersion.id, { endDate: '2019-12-31', status: 'current' }
        ))
      })
    })

    experiment('when the new charge version starts on the same day as an existing one', () => {
      let existingChargeVersion
      beforeEach(async () => {
        existingChargeVersion = new ChargeVersion()
        existingChargeVersion.fromHash({
          id: uuid(),
          dateRange: new DateRange('2020-01-01', null),
          status: 'current',
          versionNumber: 3
        })
        service.findMany.resolves([
          existingChargeVersion
        ])
        await chargeVersionService.create(chargeVersion)
      })

      test('the new charge version has the next version number', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.versionNumber).to.equal(4)
      })

      test('the end date of the new charge version is unchanged', async () => {
        const [data] = chargeVersionRepo.create.lastCall.args
        expect(data.endDate).to.be.null()
      })

      test('the existing charge version is updated to "superseded"', async () => {
        expect(chargeVersionRepo.update.callCount).to.equal(1)
        expect(chargeVersionRepo.update.calledWith(
          existingChargeVersion.id, { endDate: null, status: 'superseded' }
        ))
      })
    })
  })
})
