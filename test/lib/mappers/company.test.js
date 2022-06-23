'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const Company = require('../../../src/lib/models/company')
const companyMapper = require('../../../src/lib/mappers/company')
const { omit } = require('lodash')

const dbRow = {
  companyId: '00000000-0000-0000-0000-000000000000',
  name: 'company name',
  type: Company.COMPANY_TYPES.organisation,
  organisationType: Company.ORGANISATION_TYPES.limitedCompany
}

const companyData = {
  name: 'company name',
  type: Company.COMPANY_TYPES.person,
  organisationType: Company.ORGANISATION_TYPES.individual
}

experiment('modules/billing/mappers/company', () => {
  experiment('.crmToModel', () => {
    let result

    beforeEach(async () => {
      result = companyMapper.crmToModel(dbRow)
    })

    test('returns empty Company instance when data is empty', async () => {
      const result = companyMapper.crmToModel(null)
      expect(result instanceof Company).to.be.true()
      expect(result).to.equal({
        _companyAddresses: [],
        _companyContacts: []
      })
    })

    test('returns an Company instance', async () => {
      expect(result instanceof Company).to.be.true()
    })

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.companyId)
    })

    test('has the expected name value', async () => {
      expect(result.name).to.equal(dbRow.name)
    })

    test('has the expected type value', async () => {
      expect(result.type).to.equal(dbRow.type)
    })

    test('has the expected organisationType value', async () => {
      expect(result.organisationType).to.equal(dbRow.organisationType)
    })
  })

  experiment('.uiToModel', () => {
    let result

    beforeEach(async () => {
      result = companyMapper.uiToModel(companyData)
    })

    test('returns an Company instance', async () => {
      expect(result instanceof Company).to.be.true()
    })

    test('has the expected name value', async () => {
      expect(result.name).to.equal(companyData.name)
    })

    test('returns null if company does not exist', async () => {
      result = companyMapper.uiToModel(null)
      expect(result).to.be.null()
    })

    test('only maps id if it exists', async () => {
      result = companyMapper.uiToModel({ companyId: dbRow.companyId })
      expect(result instanceof Company).to.be.true()
      expect(result.id).to.equal(dbRow.companyId)
    })

    experiment('when type = "person"', () => {
      test('has the expected type value', async () => {
        expect(result.type).to.equal(Company.COMPANY_TYPES.person)
      })

      test('has the expected organisation type value', async () => {
        expect(result.organisationType).to.equal(Company.ORGANISATION_TYPES.individual)
      })
    })

    experiment('when type = "organisation"', () => {
      const organisationTypes = omit(Company.ORGANISATION_TYPES, 'individual')
      Object.values(organisationTypes).forEach(organisationType => {
        test(`maps data correctly when organisationType is set to ${organisationType}`, async () => {
          result = companyMapper.uiToModel({
            ...companyData,
            type: Company.COMPANY_TYPES.organisation,
            organisationType
          })
          expect(result.type).to.equal(Company.COMPANY_TYPES.organisation)
          expect(result.organisationType).to.equal(organisationType)
        })
      })
    })
  })

  experiment('.modelToCrm', () => {
    let result, company

    beforeEach(async () => {
      company = new Company()
      company.fromHash(dbRow)
      result = companyMapper.modelToCrm(company)
    })

    test('does not contain company addresses array', async () => {
      expect(result.companyAddresses).to.be.undefined()
    })

    test('does not contain company contacts array', async () => {
      expect(result.companyContacts).to.be.undefined()
    })

    test('has the expected id', async () => {
      expect(result.id).to.equal(company.id)
    })

    test('has the expected name value', async () => {
      expect(result.name).to.equal(company.name)
    })

    test('has the expected type value', async () => {
      expect(result.type).to.equal(company.type)
    })

    test('has the expected organisationType value', async () => {
      expect(result.organisationType).to.equal(company.organisationType)
    })
  })

  experiment('.pojoToModel', () => {
    let result
    const obj = {
      id: uuid(),
      type: 'organisation',
      organisationType: 'limitedCompany',
      name: 'Big Co Ltd',
      companyNumber: '000000'
    }

    beforeEach(async () => {
      result = companyMapper.pojoToModel(obj)
    })

    test('a Company model is returned', async () => {
      expect(result).to.be.an.instanceof(Company)
    })

    test('the .id property is mapped', async () => {
      expect(result.id).to.equal(obj.id)
    })

    test('the .type property is mapped', async () => {
      expect(result.type).to.equal(obj.type)
    })

    test('the .organisationType property is mapped', async () => {
      expect(result.organisationType).to.equal(obj.organisationType)
    })

    test('the .name property is mapped', async () => {
      expect(result.name).to.equal(obj.name)
    })

    test('the .companyNumber property is mapped', async () => {
      expect(result.companyNumber).to.equal(obj.companyNumber)
    })
  })
})
