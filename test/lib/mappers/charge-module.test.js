'use strict'

const uuid = require('uuid/v4')
const { set } = require('lodash')

const {
  experiment,
  test,
  afterEach,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const mapper = require('../../../src/lib/mappers/charge-module')

const invoiceAccountId = uuid()
const companyId = uuid()
const agentCompanyId = uuid()
const addressId = uuid()
const invoiceAccountNumber = 'Y12345678A'
const invoiceAccountAddressId = uuid()

const mockedAddress = {
  addressId,
  address1: '7',
  address2: 'Chuckle Road',
  address3: 'Ripple Town',
  address4: null,
  town: 'Portstewart',
  county: 'Snatchington',
  postcode: 'BT55 7PP',
  country: 'uk',
  startDate: new Date()
}

const giveMeALongString = length => [...Array(length)].map(() => Math.random().toString(36)[2]).join('')

const mockedSillyLongPostMapperAddress = {
  addressId,
  addressLine1: giveMeALongString(400),
  addressLine2: giveMeALongString(300),
  addressLine3: giveMeALongString(300),
  addressLine4: giveMeALongString(300),
  town: giveMeALongString(100),
  county: giveMeALongString(100),
  postcode: giveMeALongString(100),
  country: giveMeALongString(100)
}

const mockedPostMapperAddress = {
  addressId,
  addressLine1: '7',
  addressLine2: 'Chuckle Road',
  addressLine3: 'Ripple Town',
  addressLine4: '',
  town: 'Portstewart',
  county: 'Snatchington',
  postcode: 'BT55 7PP',
  country: 'uk'
}

const mockedInvoiceAccount = {
  invoiceAccountId,
  companyId,
  accountNumber: invoiceAccountNumber,
  startDate: '2020-01-01',
  endDate: null,
  company: {
    companyId,
    name: 'Company Ltd.',
    type: 'organisation'
  },
  lastInvoiceAccountAddress: {
    address: mockedAddress,
    agentCompany: {
      companyId: agentCompanyId,
      name: 'Eagle Punch',
      type: 'person'
    }
  },
  invoiceAccountAddresses: [
    {
      invoiceAccountAddressId,
      invoiceAccountId,
      addressId,
      startDate: '2020-01-01',
      endDate: null,
      agentCompanyId,
      contactId: null,
      address: mockedAddress,
      agentCompany: {
        companyId: agentCompanyId,
        name: 'Eagle Punch',
        type: 'person'
      }
    }
  ],
  contact: {
    type: 'person',
    firstName: 'Jane',
    lastName: 'Doe'
  }
}

experiment('lib/mappers/charge-module', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.mapInvoiceAccountToChargeModuleCustomer with a valid lastInvoiceAccountAddress', () => {
    let result
    beforeEach(async () => {
      result = await mapper.mapInvoiceAccountToChargeModuleCustomer(mockedInvoiceAccount)
    })

    test('returns the correct region derived from the invoice account number', () => {
      expect(result.region).to.equal(invoiceAccountNumber.charAt(0))
    })
    test('returns the correct customer reference', () => {
      expect(result.customerReference).to.equal(invoiceAccountNumber)
    })
  })

  experiment('.mapInvoiceAccountToChargeModuleCustomer without a valid lastInvoiceAccountAddress', () => {
    let result
    beforeEach(async () => {
      mockedInvoiceAccount.lastInvoiceAccountAddress = undefined
      result = await mapper.mapInvoiceAccountToChargeModuleCustomer(mockedInvoiceAccount)
    })

    test('returns an error', () => {
      expect(result).to.be.an.error()
    })
  })

  experiment('.extractAddress', () => {
    experiment('when the address is valid', () => {
      let result
      beforeEach(async () => {
        result = await mapper.extractAddress(mockedPostMapperAddress)
      })
      test('returns the first line as it is', () => {
        expect(result.addressLine1).to.equal(mockedPostMapperAddress.addressLine1)
      })
      test('returns the second line as it is', () => {
        expect(result.addressLine2).to.equal(mockedPostMapperAddress.addressLine2)
      })
      test('returns the third line as it is', () => {
        expect(result.addressLine3).to.equal(mockedPostMapperAddress.addressLine3)
      })
      test('omits the fourth line since it was an empty string', () => {
        expect(result.addressLine4).to.equal(undefined)
      })
      test('returns the fifth line as the town', () => {
        expect(result.addressLine5).to.equal(mockedPostMapperAddress.town)
      })
      test('returns the sixth line as a concatenation of the county and country', () => {
        expect(result.addressLine6).to.equal(mockedPostMapperAddress.county + ', ' + mockedPostMapperAddress.country)
      })
      test('returns the postcode as it is', () => {
        expect(result.postcode).to.equal(mockedPostMapperAddress.postcode)
      })
    })

    experiment('when the address is silly long', () => {
      let result
      beforeEach(async () => {
        result = await mapper.extractAddress(mockedSillyLongPostMapperAddress)
      })
      test('returns the first line truncated to 240 chars', () => {
        expect(result.addressLine1).to.equal(mockedSillyLongPostMapperAddress.addressLine1.substring(0, 240 - 3) + '...')
      })
      test('returns the second line truncated to 240 chars', () => {
        expect(result.addressLine2).to.equal(mockedSillyLongPostMapperAddress.addressLine2.substring(0, 240 - 3) + '...')
      })
      test('returns the third line truncated to 240 chars', () => {
        expect(result.addressLine3).to.equal(mockedSillyLongPostMapperAddress.addressLine3.substring(0, 240 - 3) + '...')
      })
      test('returns the fourth line truncated to 250 chars', () => {
        expect(result.addressLine4).to.equal(mockedSillyLongPostMapperAddress.addressLine4.substring(0, 240 - 3) + '...')
      })
      test('returns the fifth line as the town truncated to 60 chars', () => {
        expect(result.addressLine5).to.equal(mockedSillyLongPostMapperAddress.town.substring(0, 60 - 3) + '...')
      })
      test('returns the sixth line as a concatenation of the county and country truncated to 60 chars', () => {
        expect(result.addressLine6).to.equal((mockedSillyLongPostMapperAddress.county + ', ' + mockedSillyLongPostMapperAddress.country).substring(0, 60 - 3) + '...')
      })
      test('returns the postcode truncated to 60 chars', () => {
        expect(result.postcode).to.equal(mockedSillyLongPostMapperAddress.postcode.substring(0, 60 - 3) + '...')
      })
    })
  })

  const agentCompanyObject = {
    name: 'Agent Ltd.'
  }
  const coreCompanyObject = {
    name: 'Company Inc.'
  }

  experiment('.extractCustomerName', () => {
    experiment('When there is no agent', () => {
      let result
      beforeEach(async () => {
        result = await mapper.extractCustomerName(coreCompanyObject)
      })
      test('Responds with the name of the company', () => {
        expect(result).to.equal(coreCompanyObject.name)
      })
    })
    experiment('When there is an agent', () => {
      let result
      beforeEach(async () => {
        result = await mapper.extractCustomerName({ ...coreCompanyObject }, { ...agentCompanyObject })
      })
      test('Responds with the name of the agent company', () => {
        expect(result).to.equal(agentCompanyObject.name)
      })
    })
  })
  experiment('.extractFAO', () => {
    experiment('when there is a contact', () => {
      let result
      beforeEach(async () => {
        result = await mapper.extractFAO(mockedInvoiceAccount)
      })
      test('responds with the name of the only contact', () => {
        expect(result).to.equal(mockedInvoiceAccount.contact.fullName)
      })
    })
    experiment('when there are no contacts', () => {
      let result
      beforeEach(async () => {
        result = await mapper.extractFAO(set(mockedInvoiceAccount, 'contact', null))
      })
      test('responds with null', () => {
        expect(result).to.equal(null)
      })
    })
  })
})
