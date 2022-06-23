'use strict'

const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address')
const Company = require('../../../src/lib/models/company')
const Address = require('../../../src/lib/models/address')
const Contact = require('../../../src/lib/models/contact-v2')
const DateRange = require('../../../src/lib/models/date-range')

const TEST_GUID = 'add1cf3b-7296-4817-b013-fea75a928580'

experiment('lib/models/invoice-account-address', () => {
  let invoiceAccountAddress

  beforeEach(async () => {
    invoiceAccountAddress = new InvoiceAccountAddress()
  })

  experiment('.id', () => {
    test('can be set to a guid string', async () => {
      invoiceAccountAddress.id = TEST_GUID
      expect(invoiceAccountAddress.id).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        invoiceAccountAddress.id = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.invoiceAccountId', () => {
    test('can be set to a guid string', async () => {
      invoiceAccountAddress.invoiceAccountId = TEST_GUID
      expect(invoiceAccountAddress.invoiceAccountId).to.equal(TEST_GUID)
    })

    test('throws an error if set to a non-guid string', async () => {
      const func = () => {
        invoiceAccountAddress.invoiceAccountId = 'hey'
      }
      expect(func).to.throw()
    })
  })

  experiment('.address', () => {
    test('can be set to a valid Address', async () => {
      const address = new Address()
      invoiceAccountAddress.address = address
      expect(invoiceAccountAddress.address).to.equal(address)
    })

    test('throws an error if set to another model', async () => {
      const func = () => {
        invoiceAccountAddress.address = new Company()
      }
      expect(func).to.throw()
    })

    test('throws an error if set to null', async () => {
      const func = () => {
        invoiceAccountAddress.address = null
      }
      expect(func).to.throw()
    })
  })

  experiment('.agentCompany', () => {
    test('can be set to a valid Company', async () => {
      const company = new Company()
      invoiceAccountAddress.agentCompany = company
      expect(invoiceAccountAddress.agentCompany).to.equal(company)
    })

    test('can be set to null', async () => {
      invoiceAccountAddress.agentCompany = null
      expect(invoiceAccountAddress.agentCompany).to.equal(null)
    })

    test('throws an error if set to another model', async () => {
      const func = () => {
        invoiceAccountAddress.agentCompany = new Address()
      }
      expect(func).to.throw()
    })
  })

  experiment('.contact', () => {
    test('can be set to a valid Contact', async () => {
      const contact = new Contact()
      invoiceAccountAddress.contact = contact
      expect(invoiceAccountAddress.contact).to.equal(contact)
    })

    test('can be set to null', async () => {
      invoiceAccountAddress.contact = null
      expect(invoiceAccountAddress.contact).to.equal(null)
    })

    test('throws an error if set to another model', async () => {
      const func = () => {
        invoiceAccountAddress.contact = new Address()
      }
      expect(func).to.throw()
    })
  })

  experiment('.dateRange', () => {
    let dateRange

    beforeEach(async () => {
      dateRange = new DateRange('2019-04-01', '2020-03-31')
    })

    test('can be set to a DateRange object', async () => {
      invoiceAccountAddress.dateRange = dateRange
      expect(invoiceAccountAddress.dateRange).to.equal(dateRange)
    })

    test('throws an error if set to any other type', async () => {
      const func = () => {
        invoiceAccountAddress.dateRange = new Address()
      }

      expect(func).to.throw()
    })
  })
})
