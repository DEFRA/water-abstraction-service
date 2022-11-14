'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const moment = require('moment')
const ChargeVersion = require('../../../src/lib/models/charge-version')
const ChargeVersionWorkflow = require('../../../src/lib/models/charge-version-workflow')
const Licence = require('../../../src/lib/models/licence')
const User = require('../../../src/lib/models/user')

const mapper = require('../../../src/lib/mappers/charge-version-workflow')

experiment('lib/mappers/charge-version-workflow', () => {
  let row, model

  experiment('dbToModel', () => {
    beforeEach(async () => {
      row = {
        chargeVersionWorkflowId: '6457d39e-dd20-4dad-82e4-e4bd40ecdf89',
        createdBy: {
          email: 'creator@example.com',
          id: 123
        },
        approverComments: 'Nice job!',
        status: 'review',
        dateCreated: '2020-08-24T08:47:16.913Z',
        dateUpdated: '2020-08-24T08:47:16.913Z',
        data: {
          chargeVersion: {
            dateRange: {
              startDate: '2019-01-01'
            },
            chargeElements: [
              {
                loss: 'high',
                season: 'summer',
                source: 'supported',
                abstractionPeriod: {
                  endDay: 1,
                  endMonth: 12,
                  startDay: 1,
                  startMonth: 1
                },
                purposeUse: {
                  id: 'eef6bbae-821f-477f-869d-e4c930c24532',
                  code: '400',
                  name: 'Spray Irrigation - Direct',
                  lossFactor: 'high',
                  dateCreated: '2019-08-29T12:50:59.712Z',
                  dateUpdated: '2020-08-19T09:00:01.392Z',
                  isTwoPartTariff: true
                },
                eiucSource: 'other'
              }
            ]
          }
        },
        licence: {
          licenceId: uuid(),
          licenceRef: '01/123/R',
          isWaterUndertaker: true,
          regions: {
            historicalAreaCode: 'DALES',
            regionalChargeArea: 'Yorkshire'
          },
          startDate: '1998-04-01',
          expiredDate: null,
          lapsedDate: null,
          revokedDate: null,
          endDate: null,
          region: {
            regionId: uuid(),
            chargeRegionId: 'A',
            name: 'Test region',
            displayName: 'Test region'
          }
        },
        licenceVersionId: '1294g68e-kk09-7dhg-24e9-e6aa42bcfq81',
        dateDeleted: '2020-10-24T08:47:16.913Z'
      }

      model = mapper.dbToModel(row)
    })

    test('returns a ChargeVersionWorkflow model', async () => {
      expect(model).to.be.an.instanceof(ChargeVersionWorkflow)
    })

    test('maps the charge version workflow id', async () => {
      expect(model.id).to.equal(row.chargeVersionWorkflowId)
    })

    test('maps the created by user', async () => {
      expect(model.createdBy).to.be.an.instanceof(User)
      expect(model.createdBy.id).to.equal(123)
      expect(model.createdBy.email).to.equal('creator@example.com')
    })

    test('maps the approver comments', async () => {
      expect(model.approverComments).to.equal('Nice job!')
    })

    test('maps the status', async () => {
      expect(model.status).to.equal('review')
    })

    test('maps the charge version', async () => {
      expect(model.chargeVersion).to.be.an.instanceof(ChargeVersion)
    })

    test('maps the licence', async () => {
      expect(model.licence).to.be.an.instanceof(Licence)
    })

    test('the licence is undefined if the licence property is undefined', async () => {
      delete row.licence
      model = mapper.dbToModel(row)
      expect(model.licence).to.be.undefined()
    })
  })

  experiment('.modelToDb', () => {
    const licenceVersionId = uuid()
    beforeEach(async () => {
      const licence = new Licence(uuid())
      const creator = new User()
      creator.fromHash({
        id: 123,
        email: 'creator@example.com'
      })
      const chargeVersion = new ChargeVersion(uuid())
      model = new ChargeVersionWorkflow()
      model.fromHash({
        id: uuid(),
        licence,
        approverComments: 'Great work!',
        status: 'review',
        createdBy: creator,
        chargeVersion,
        licenceVersionId,
        dateDeleted: '2020-10-24T08:47:16.913Z'
      })

      row = mapper.modelToDb(model)
    })

    test('the .id property is mapped', async () => {
      expect(row.chargeVersionWorkflowId).to.equal(model.id)
    })

    test('the .licenceId property is mapped', async () => {
      expect(row.licenceId).to.equal(model.licence.id)
    })

    test('the .approverComments property is mapped', async () => {
      expect(row.approverComments).to.equal('Great work!')
    })

    test('the .status property is mapped', async () => {
      expect(row.status).to.equal('review')
    })

    test('the .createdBy property is mapped', async () => {
      expect(row.createdBy).to.be.an.object()
      expect(row.createdBy).to.equal({
        id: 123,
        email: 'creator@example.com'
      })
    })

    test('the .chargeVersion property is mapped to the data jsonb column', async () => {
      expect(row.data.chargeVersion).to.be.an.object()
      expect(row.data.chargeVersion.id).to.equal(model.chargeVersion.id)
    })

    test('the .licenceVersionId property is mapped', async () => {
      expect(row.licenceVersionId).to.equal(licenceVersionId)
    })

    test('the .dateDeleted property is mapped', async () => {
      expect(row.dateDeleted).to.equal(moment('2020-10-24T08:47:16.913Z'))
    })
  })
})
