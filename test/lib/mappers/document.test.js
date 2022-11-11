'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')

const Document = require('../../../src/lib/models/document')
const documentMapper = require('../../../src/lib/mappers/document')
const Role = require('../../../src/lib/models/role')

experiment('src/lib/mappers/document', () => {
  experiment('.crmToModel', () => {
    let data, model

    beforeEach(async () => {
      data = {
        documentId: uuid(),
        startDate: '2019-01-01',
        endDate: '2020-02-03',
        status: 'current',
        documentRoles: [{
          documentRoleId: uuid(),
          roleName: 'licenceHolder',
          company: {
            companyId: uuid(),
            name: 'Test company'
          }
        }],
        documentRef: '0/123/456'
      }
      model = documentMapper.crmToModel(data)
    })

    test('returns a Document model', async () => {
      expect(model).to.be.an.instanceof(Document)
    })

    test('the data is mapped correctly', async () => {
      expect(model.id).to.equal(data.documentId)
      expect(model.status).to.equal(data.status)
      expect(model.dateRange.startDate).to.equal(data.startDate)
      expect(model.dateRange.endDate).to.equal(data.endDate)

      expect(model.roles).to.be.an.array().length(1)
      expect(model.roles[0]).to.be.an.instanceof(Role)
      expect(model.licenceNumber).to.equal(data.documentRef)
    })

    test('the roles are an empty array if not present in the data', async () => {
      delete data.documentRoles
      model = documentMapper.crmToModel(data)
      expect(model.roles).to.equal([])
    })
  })
})
