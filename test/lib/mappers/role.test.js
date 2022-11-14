'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')

const Role = require('../../../src/lib/models/role')
const roleMapper = require('../../../src/lib/mappers/role')

experiment('src/lib/mappers/role', () => {
  experiment('.crmToModel', () => {
    let data, model

    beforeEach(async () => {
      data = {
        documentRoleId: uuid(),
        roleName: 'licenceHolder',
        startDate: '2019-01-01',
        endDate: '2020-02-03',
        company: {
          id: uuid(),
          name: 'Test co'
        }
      }
      model = roleMapper.crmToModel(data)
    })

    test('returns a Role model', async () => {
      expect(model).to.be.an.instanceof(Role)
    })

    test('the data is mapped correctly', async () => {
      expect(model.id).to.equal(data.documentRoleId)
      expect(model.roleName).to.equal(data.roleName)
      expect(model.dateRange.startDate).to.equal(data.startDate)
      expect(model.dateRange.endDate).to.equal(data.endDate)
      expect(model.company.id).to.equal(data.company.companyId)
      expect(model.company.name).to.equal(data.company.name)
    })

    test('the company is undefined if not present in the data', async () => {
      delete data.company
      model = roleMapper.crmToModel(data)
      expect(model.company).to.be.undefined()
    })
  })
})
