'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')

const sandbox = require('sinon').createSandbox()

const licencesService = require('../../../src/lib/services/licences')
const returnsService = require('../../../src/lib/services/returns')

const repos = require('../../../src/lib/connectors/repos')

// Models
const Licence = require('../../../src/lib/models/licence')
const LicenceVersion = require('../../../src/lib/models/licence-version')
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../../../src/lib/models/constants')
const moment = require('moment')

const data = {
  dbRow: {
    licenceId: '6e4b0cb8-7d37-4119-be3b-855c6a26b3be',
    licenceRef: '01/123/ABC',
    isWaterUndertaker: false,
    regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
    regionName: 'Anglian',
    chargeRegionId: 'A',
    naldRegionId: 1,
    startDate: '2019-01-01',
    expiredDate: null,
    lapsedDate: null,
    revokedDate: null,
    regions: {
      historicalAreaCode: 'ABC',
      regionalChargeArea: 'Anglian'
    },
    region: {
      regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
      name: 'Anglian',
      displayName: 'Anglian',
      chargeRegionId: 'A',
      naldRegionId: 1
    }
  }
}

experiment('src/lib/services/licences', () => {
  beforeEach(async () => {
    sandbox.stub(repos.licences, 'findOne')
    sandbox.stub(repos.licences, 'findOneByLicenceRef')
    sandbox.stub(repos.licences, 'findByLicenceRef')
    sandbox.stub(repos.licences, 'updateIncludeLicenceInSupplementaryBilling')
    sandbox.stub(repos.licences, 'updateIncludeInSupplementaryBillingStatusForBatch')
    sandbox.stub(repos.licences, 'updateIncludeInSupplementaryBillingStatusForBatchCreatedDate')
    sandbox.stub(repos.licences, 'update')
    sandbox.stub(repos.licenceVersions, 'findByLicenceId')
    sandbox.stub(repos.licenceVersions, 'findOne')
    sandbox.stub(repos.billingInvoiceLicences, 'findAll')
    sandbox.stub(returnsService, 'getReturnsForLicence')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getLicenceById', () => {
    let result

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        repos.licences.findOne.resolves(data.dbRow)
        result = await licencesService.getLicenceById(data.dbRow.licenceId)
      })

      test('calls repos.licences.findOne() with supplied licence ID', async () => {
        const [id] = repos.licences.findOne.lastCall.args
        expect(id).to.equal(data.dbRow.licenceId)
      })

      test('returns licence instance', async () => {
        expect(result instanceof Licence).to.be.true()
      })
    })

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        repos.licences.findOne.resolves(null)
        result = await licencesService.getLicenceById(data.dbRow.licenceId)
      })

      test('resolves with null', async () => {
        expect(result).to.equal(null)
      })
    })
  })

  experiment('.getLicenceByLicenceRef', () => {
    let result

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        repos.licences.findOneByLicenceRef.resolves([data.dbRow])

        result = await licencesService.getLicenceByLicenceRef(
          data.dbRow.licenceRef,
          data.dbRow.region.naldRegionId
        )
      })

      test('calls repos.licences.findOneByLicenceRef() with supplied licence ref', async () => {
        const [licenceRef] = repos.licences.findOneByLicenceRef.lastCall.args
        expect(licenceRef).to.equal(data.dbRow.licenceRef)
      })

      test('returns licence instance', async () => {
        expect(result instanceof Licence).to.be.true()
      })
    })

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        repos.licences.findOneByLicenceRef.resolves(null)

        result = await licencesService.getLicenceByLicenceRef(
          data.dbRow.licenceRef
        )
      })

      test('resolves with null', async () => {
        expect(result).to.equal(null)
      })
    })
  })

  experiment('.getLicenceVersions', () => {
    experiment('when there are no versions returned from the repository', () => {
      test('an empty array is returned by the service', async () => {
        repos.licenceVersions.findByLicenceId.resolves([])
        const result = await licencesService.getLicenceVersions(uuid())

        expect(result).to.equal([])
      })
    })

    experiment('when versions are returned from the repository', () => {
      test('the results are mapped to LicenceVersion models', async () => {
        const licenceId = uuid()

        repos.licenceVersions.findByLicenceId.resolves([
          {
            status: 'superseded',
            endDate: '2010-10-10',
            startDate: '2010-01-01',
            externalId: '1:100:100:0',
            dateUpdated: '2020-01-01 10:10:10.000000',
            dateCreated: '2020-01-01 10:10:10.000000',
            licenceId,
            licenceVersionId: '17c45db7-aeaa-4c2e-bd58-584696b56681',
            issue: 100,
            increment: 0
          },
          {
            status: 'current',
            endDate: null,
            startDate: '2010-01-01',
            externalId: '1:100:100:1',
            dateUpdated: '2020-01-01 10:10:10.000000',
            dateCreated: '2020-01-01 10:10:10.000000',
            licenceId,
            licenceVersionId: '85b98b0e-6d75-4c26-ada2-079a86fe9701',
            issue: 100,
            increment: 1
          }
        ])
        const result = await licencesService.getLicenceVersions(uuid())

        expect(result.length).to.equal(2)
        expect(result[0].id).to.equal('17c45db7-aeaa-4c2e-bd58-584696b56681')
        expect(result[0]).to.be.an.instanceOf(LicenceVersion)
        expect(result[1].id).to.equal('85b98b0e-6d75-4c26-ada2-079a86fe9701')
        expect(result[1]).to.be.an.instanceOf(LicenceVersion)
      })
    })
  })

  experiment('.getLicenceVersionById', () => {
    let licenceVersion
    let licenceVersionId

    experiment('when no licence version is found for the id', () => {
      beforeEach(async () => {
        licenceVersionId = uuid()
        repos.licenceVersions.findOne.resolves(null)
        licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId)
      })

      test('null is returned', async () => {
        expect(licenceVersion).to.equal(null)
      })

      test('the expected call to the repository layer is made', async () => {
        const [id] = repos.licenceVersions.findOne.lastCall.args
        expect(id).to.equal(licenceVersionId)
      })
    })

    experiment('when a licence version is found for the id', () => {
      beforeEach(async () => {
        licenceVersionId = uuid()
        repos.licenceVersions.findOne.resolves({
          status: 'superseded',
          endDate: '2001-11-01',
          startDate: '2001-05-01',
          externalId: '1:1:100:1',
          dateUpdated: '2001-01-01 10:10:10.000000',
          dateCreated: '2001-01-01 10:10:10.000000',
          licenceId: uuid(),
          licenceVersionId,
          issue: 100,
          increment: 1
        })
        licenceVersion = await licencesService.getLicenceVersionById(licenceVersionId)
      })

      test('the expected call to the repository layer is made', async () => {
        const [id] = repos.licenceVersions.findOne.lastCall.args
        expect(id).to.equal(licenceVersionId)
      })

      test('the licence version is returned in a model instance', async () => {
        expect(licenceVersion).to.be.an.instanceOf(LicenceVersion)
        expect(licenceVersion.id).to.equal(licenceVersionId)
      })
    })
  })

  experiment('.updateIncludeInSupplementaryBillingStatus', () => {
    test('passes the data to the repo', async () => {
      const licenceIds = ['one', 'two']
      const from = INCLUDE_IN_SUPPLEMENTARY_BILLING.yes
      const to = INCLUDE_IN_SUPPLEMENTARY_BILLING.no

      await licencesService.updateIncludeInSupplementaryBillingStatus(from, to, ...licenceIds)

      const [firstLicenceId, firstFrom, firstTo] = repos.licences.updateIncludeLicenceInSupplementaryBilling.firstCall.args
      const [secondLicenceId, secondFrom, secondTo] = repos.licences.updateIncludeLicenceInSupplementaryBilling.lastCall.args

      expect(firstFrom).to.equal(from)
      expect(firstTo).to.equal(to)
      expect(firstLicenceId).to.equal(licenceIds[0])

      expect(secondFrom).to.equal(from)
      expect(secondTo).to.equal(to)
      expect(secondLicenceId).to.equal(licenceIds[1])
    })
  })

  experiment('.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate', () => {
    let batchCreatedDate
    let regionId

    beforeEach(async () => {
      batchCreatedDate = moment()
      regionId = uuid()
      await licencesService.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate(regionId, batchCreatedDate)
    })

    test('passes the correct region id to the repo', async () => {
      const [id] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate.lastCall.args
      expect(id).to.equal(regionId)
    })

    test('passes the correct batch created date to the repo', async () => {
      const [, createdDate] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate.lastCall.args
      expect(createdDate).to.equal(batchCreatedDate)
    })

    test('updates the status from yes to no', async () => {
      const [,, from, to] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatchCreatedDate.lastCall.args
      expect(from).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.yes)
      expect(to).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.no)
    })
  })

  experiment('.updateIncludeInSupplementaryBillingStatusForSentBatch', () => {
    beforeEach(async () => {
      await licencesService.updateIncludeInSupplementaryBillingStatusForSentBatch('test-batch-id')
    })

    test('initially updates the status from yes to no', async () => {
      const [batchId, from, to] = repos.licences.updateIncludeInSupplementaryBillingStatusForBatch.firstCall.args
      expect(batchId).to.equal('test-batch-id')
      expect(from).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.yes)
      expect(to).to.equal(INCLUDE_IN_SUPPLEMENTARY_BILLING.no)
    })
  })

  experiment('.getLicenceInvoices', () => {
    const tempLicenceId = uuid()
    beforeEach(async () => {
      repos.billingInvoiceLicences.findAll.resolves({ data: [] })
      await licencesService.getLicenceInvoices(tempLicenceId)
    })

    test('calls billingInvoiceLicences.findAll()', () => {
      expect(repos.billingInvoiceLicences.findAll.called).to.be.true()
    })

    test('calls billingInvoiceLicences.findAll() with the right parameters', () => {
      expect(repos.billingInvoiceLicences.findAll.calledWith(tempLicenceId, 1, 10)).to.be.true()
    })
  })

  experiment('.getReturnsByLicenceId', () => {
    const licenceId = uuid()
    const page = 1
    const perPage = 50

    beforeEach(async () => {
      repos.licences.findOne.resolves(data.dbRow)
      await licencesService.getReturnsByLicenceId(licenceId, page, perPage)
    })

    test('calls repos.licences.findOne() with supplied licence ID', async () => {
      const [id] = repos.licences.findOne.lastCall.args
      expect(id).to.equal(licenceId)
    })

    test('gets returns for licence', async () => {
      expect(returnsService.getReturnsForLicence.calledWith(
        data.dbRow.licenceRef, page, perPage
      )).to.be.true()
    })
  })
})
