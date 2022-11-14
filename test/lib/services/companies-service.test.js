const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { v4: uuid } = require('uuid')

const Company = require('../../../src/lib/models/company')
const Region = require('../../../src/lib/models/region')

const CompanyAddress = require('../../../src/lib/models/company-address')
const CompanyContact = require('../../../src/lib/models/company-contact')
const companiesService = require('../../../src/lib/services/companies-service')
const regionsService = require('../../../src/lib/services/regions-service')

const companiesConnector = require('../../../src/lib/connectors/crm-v2/companies')
const mappers = require('../../../src/lib/mappers')
const { NotFoundError, InvalidEntityError } = require('../../../src/lib/errors')

const TEST_GUID = uuid()

experiment('modules/billing/services/companies-service', () => {
  beforeEach(async () => {
    sandbox.stub(companiesConnector, 'getInvoiceAccountsByCompanyId')
    sandbox.stub(companiesConnector, 'getCompany')
    sandbox.stub(companiesConnector, 'searchCompaniesByName')
    sandbox.stub(companiesConnector, 'createCompany')
    sandbox.stub(companiesConnector, 'createCompanyContact')
    sandbox.stub(companiesConnector, 'getCompanyAddresses')
    sandbox.stub(companiesConnector, 'createCompanyAddress')
    sandbox.stub(companiesConnector, 'getCompanyLicences')

    sandbox.stub(mappers.company, 'crmToModel')
    sandbox.stub(mappers.company, 'modelToCrm')
    sandbox.stub(mappers.company, 'uiToModel')

    sandbox.stub(mappers.companyAddress, 'crmToModel')

    sandbox.stub(mappers.companyContact, 'crmToModel')

    sandbox.stub(regionsService, 'getRegion')

    sandbox.stub(mappers.invoiceAccount, 'crmToModel')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getCompany', () => {
    let companyId, companyData, companyModel, response
    beforeEach(async () => {
      companyId = TEST_GUID
      companyData = {
        companyId,
        name: 'company name',
        type: Company.COMPANY_TYPES.organisation
      }
      companyModel = new Company(TEST_GUID)

      companiesConnector.getCompany.resolves(companyData)
      mappers.company.crmToModel.returns(companyModel)

      response = await companiesService.getCompany(companyId)
    })

    test('calls the companies connector with the company id', () => {
      expect(companiesConnector.getCompany.calledWith(
        companyId
      )).to.be.true()
    })

    test('calls the mapper with the company data returned from crm', () => {
      expect(mappers.company.crmToModel.calledWith(
        companyData
      )).to.be.true()
    })

    test('returns the output of the company mapper', () => {
      expect(response).to.equal(companyModel)
    })

    test('if company does not exist, throws a NotFoundError', async () => {
      companiesConnector.getCompany.resolves(null)
      try {
        response = await companiesService.getCompany(companyId)
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError)
        expect(err.message).to.equal(`Company ${companyId} not found`)
      }
    })
  })

  experiment('.searchCompaniesByName', () => {
    let inputString, companyData, response
    beforeEach(async () => {
      inputString = 'Test'
      companyData = {
        id: uuid(),
        name: 'Test Limited',
        type: Company.COMPANY_TYPES.organisation
      }

      companiesConnector.searchCompaniesByName.resolves([companyData])

      response = await companiesService.searchCompaniesByName(inputString)
    })

    test('calls the companies connector with a search string', () => {
      expect(companiesConnector.searchCompaniesByName.calledWith(
        inputString
      )).to.be.true()
    })

    test('returns an array of results', () => {
      expect(Array.isArray(response)).to.equal(true)
    })
  })

  experiment('.getCompanyAddresses', () => {
    let companyId, companyAddressData, companyAddressModel, response
    beforeEach(async () => {
      companyId = TEST_GUID
      companyAddressData = [{
        companyAddressId: uuid(),
        startDate: '2020-04-01',
        endDate: null
      }]
      companyAddressModel = new CompanyAddress(TEST_GUID)

      companiesConnector.getCompanyAddresses.resolves(companyAddressData)
      mappers.companyAddress.crmToModel.returns(companyAddressModel)

      response = await companiesService.getCompanyAddresses(companyId)
    })

    test('calls the companies connector with the company id', () => {
      expect(companiesConnector.getCompanyAddresses.calledWith(
        companyId
      )).to.be.true()
    })

    test('calls the mapper with the company data returned from crm', () => {
      expect(mappers.companyAddress.crmToModel.calledWith(
        companyAddressData[0]
      )).to.be.true()
    })

    test('returns the output of the company mapper', () => {
      expect(response).to.equal([companyAddressModel])
    })
  })

  experiment('.createCompany', () => {
    let companyData, mappedData, newCompany, companyModel, response
    beforeEach(async () => {
      companyData = {
        name: 'company name',
        type: Company.ORGANISATION_TYPES.limitedCompany
      }
      mappedData = {
        name: 'company name',
        type: Company.COMPANY_TYPES.organisation,
        organisationType: Company.ORGANISATION_TYPES.limitedCompany
      }
      newCompany = {
        companyId: TEST_GUID,
        name: 'company name',
        type: Company.COMPANY_TYPES.organisation,
        organisationType: Company.ORGANISATION_TYPES.limitedCompany
      }
      companyModel = new Company(TEST_GUID)

      companiesConnector.createCompany.resolves(newCompany)
      mappers.company.modelToCrm.returns(mappedData)
      mappers.company.crmToModel.returns(companyModel)

      response = await companiesService.createCompany(companyData)
    })
    test('calls the company mapper to map data for the DB call', async () => {
      const [passedData] = mappers.company.modelToCrm.lastCall.args
      expect(passedData).to.equal(companyData)
    })

    test('calls the companies connector with the mapped data', async () => {
      const [companyData] = companiesConnector.createCompany.lastCall.args
      expect(companyData).to.equal(mappedData)
    })

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [companyData] = mappers.company.crmToModel.lastCall.args
      expect(companyData).to.equal(newCompany)
    })

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(companyModel)
    })
  })

  experiment('.createCompanyAddress', () => {
    let companyId, companyAddressData, newCompanyAddress, companyAddressModel, response
    beforeEach(async () => {
      companyId = uuid()
      companyAddressData = {
        address: { companyId: uuid() },
        startDate: '2020-04-01',
        endDate: null
      }
      newCompanyAddress = {
        companyAddressId: TEST_GUID
      }
      companyAddressModel = new CompanyAddress(TEST_GUID)

      companiesConnector.createCompanyAddress.resolves(newCompanyAddress)
      mappers.companyAddress.crmToModel.returns(companyAddressModel)

      response = await companiesService.createCompanyAddress(companyId, companyAddressData)
    })

    test('calls the companies address connector with the mapped data', async () => {
      const [id, companyAddressData] = companiesConnector.createCompanyAddress.lastCall.args
      expect(id).to.equal(companyId)
      expect(companyAddressData).to.equal(companyAddressData)
    })

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [companyAddressData] = mappers.companyAddress.crmToModel.lastCall.args
      expect(companyAddressData).to.equal(newCompanyAddress)
    })

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(companyAddressModel)
    })
  })

  experiment('.createCompanyContact', () => {
    let companyId, companyContactData, newCompanyContact, companyContactModel, response
    beforeEach(async () => {
      companyId = uuid()
      companyContactData = {
        firstName: 'Bob',
        lastName: 'Jones',
        type: 'licenceHolder'
      }
      newCompanyContact = {
        companyContactId: TEST_GUID,
        firstName: 'Bob',
        lastName: 'Jones',
        type: 'licenceHolder'
      }
      companyContactModel = new CompanyContact(TEST_GUID)

      companiesConnector.createCompanyContact.resolves(newCompanyContact)
      mappers.companyContact.crmToModel.returns(companyContactModel)

      response = await companiesService.createCompanyContact(companyId, companyContactData)
    })

    test('calls the companies address connector with the mapped data', async () => {
      const [id, companyContactData] = companiesConnector.createCompanyContact.lastCall.args
      expect(id).to.equal(companyId)
      expect(companyContactData).to.equal(companyContactData)
    })

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [companyContactData] = mappers.companyContact.crmToModel.lastCall.args
      expect(companyContactData).to.equal(newCompanyContact)
    })

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(companyContactModel)
    })
  })

  experiment('.getCompanyModel', () => {
    let companyData, companyModel, response
    beforeEach(async () => {
      companyData = {
        name: 'company name',
        type: Company.ORGANISATION_TYPES.limitedCompany
      }
      companyModel = new Company(TEST_GUID)

      mappers.company.uiToModel.returns(companyModel)

      response = await companiesService.getCompanyModel(companyData)
    })

    experiment('when only an address id is provided', () => {
      beforeEach(async () => {
        companyData = {
          companyId: TEST_GUID
        }
        companyModel = new Company(TEST_GUID)
        mappers.company.uiToModel.returns(companyModel)
        response = await companiesService.getCompanyModel(companyData)
      })
      test('calls the address mapper to map data from the ui', async () => {
        const [passedData] = mappers.company.uiToModel.lastCall.args
        expect(passedData).to.equal(companyData)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(companyModel)
      })
    })

    experiment('when new address data is provided', () => {
      beforeEach(async () => {
        companyData = {
          name: 'company name',
          type: Company.ORGANISATION_TYPES.limitedCompany
        }
        companyModel = new Company()
        companyModel.fromHash({
          name: companyData.name,
          type: Company.COMPANY_TYPES.organisation,
          organisationType: companyData.type
        })
        mappers.company.uiToModel.returns(companyModel)

        response = await companiesService.getCompanyModel(companyData)
      })
      test('calls the address mapper to map data from the ui', async () => {
        const [passedData] = mappers.company.uiToModel.lastCall.args
        expect(passedData).to.equal(companyData)
      })

      test('returns the output from the mapper', async () => {
        expect(response).to.equal(companyModel)
      })

      test('throws an invalid entity error when the address data is invalid', async () => {
        companyData = {
          addressLine2: '742',
          addressLine3: 'Evergreen Terrace',
          town: 'Springfield'
        }
        companyModel = new Company()
        companyModel.fromHash(companyData)
        mappers.company.uiToModel.returns(companyModel)

        try {
          await companiesService.getCompanyModel(companyData)
        } catch (err) {
          expect(err).to.be.instanceOf(InvalidEntityError)
          expect(err.message).to.equal('Invalid company')
        }
      })
    })

    test('handles null company', async () => {
      response = await companiesService.getCompanyModel(null)
      expect(response).to.be.null()
    })
  })

  experiment('.getCompanyInvoiceAccounts', () => {
    const COMPANY_ID = uuid()
    const REGION_ID = uuid()

    const INVOICE_ACCOUNTS = [{
      invoiceAccountNumber: 'A12345678A'
    }, {
      invoiceAccountNumber: 'B23456789B'
    }, {
      invoiceAccountNumber: 'A34567890A'
    }]

    beforeEach(async () => {
      const region = new Region().fromHash({
        code: 'A'
      })

      companiesConnector.getInvoiceAccountsByCompanyId.resolves(INVOICE_ACCOUNTS)
      regionsService.getRegion.resolves(region)
    })

    experiment('when a region ID is supplied', () => {
      beforeEach(async () => {
        await companiesService.getCompanyInvoiceAccounts(COMPANY_ID, REGION_ID)
      })

      test('the companies connector is called with the company ID', async () => {
        expect(companiesConnector.getInvoiceAccountsByCompanyId.calledWith(COMPANY_ID))
      })

      test('the region is fetched with the region ID', async () => {
        expect(regionsService.getRegion.calledWith(REGION_ID)).to.be.true()
      })

      test('only invoice accounts starting with the matching region code letter are returned', async () => {
        expect(mappers.invoiceAccount.crmToModel.callCount).to.equal(2)
        expect(mappers.invoiceAccount.crmToModel.calledWith(
          INVOICE_ACCOUNTS[0]
        )).to.be.true()
        expect(mappers.invoiceAccount.crmToModel.calledWith(
          INVOICE_ACCOUNTS[2]
        )).to.be.true()
      })
    })

    experiment('when a region ID is not supplied', () => {
      beforeEach(async () => {
        await companiesService.getCompanyInvoiceAccounts(COMPANY_ID)
      })

      test('the companies connector is called with the company ID', async () => {
        expect(companiesConnector.getInvoiceAccountsByCompanyId.calledWith(COMPANY_ID))
      })

      test('the region is not fetched', async () => {
        expect(regionsService.getRegion.called).to.be.false()
      })

      test('all invoice accounts are returned', async () => {
        expect(mappers.invoiceAccount.crmToModel.callCount).to.equal(3)
        expect(mappers.invoiceAccount.crmToModel.calledWith(
          INVOICE_ACCOUNTS[0]
        )).to.be.true()
        expect(mappers.invoiceAccount.crmToModel.calledWith(
          INVOICE_ACCOUNTS[1]
        )).to.be.true()
        expect(mappers.invoiceAccount.crmToModel.calledWith(
          INVOICE_ACCOUNTS[2]
        )).to.be.true()
      })
    })
  })

  experiment('.getCompanyLicences', () => {
    let companyId, companyData, response
    beforeEach(async () => {
      companyId = uuid()
      companyData = {
        id: uuid(),
        licenceNumber: 'xx/xx/xxx'
      }

      companiesConnector.getCompanyLicences.resolves([companyData])

      response = await companiesService.getCompanyLicences(companyId)
    })

    test('calls the companies connector with the GUID', () => {
      expect(companiesConnector.getCompanyLicences.calledWith(
        companyId
      )).to.be.true()
    })

    test('returns an array of results', () => {
      expect(Array.isArray(response)).to.equal(true)
    })
  })
})
