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

const companyContactsService = require('../../../src/lib/services/company-contacts')
const companyContactsRepo = require('../../../src/lib/connectors/crm-v2/companies')
const CompanyContact = require('../../../src/lib/models/company-contact')

experiment('lib/services/company-contacts', () => {
  beforeEach(async () => {
    sandbox.stub(companyContactsRepo, 'getCompanyContacts')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getCompanyContacts', () => {
    experiment('when there is data from the repository', () => {
      test('it is returned mapped to CompanyContact models', async () => {
        companyContactsRepo.getCompanyContacts.resolves([
          {
            companyContactId: uuid(),
            companyId: uuid(),
            contactId: uuid(),
            roleId: uuid(),
            isDefault: true,
            startDate: '2006-03-10',
            endDate: null,
            dateCreated: '2020-05-06T14:20:56.425Z',
            dateUpdated: '2020-05-31T06:34:33.764Z'
          }
        ])

        const result = await companyContactsService.getCompanyContacts(uuid())

        expect(result.length).to.equal(1)
        expect(result[0]).to.be.an.instanceOf(CompanyContact)
      })
    })

    experiment('when the repository throws a not found error', () => {
      test('it is thrown by the service', async () => {
        const err = new Error('Not found')
        companyContactsRepo.getCompanyContacts.rejects(err)

        const result = await expect(companyContactsService.getCompanyContacts(uuid())).to.reject()
        expect(result).to.equal(err)
      })
    })
  })
})
