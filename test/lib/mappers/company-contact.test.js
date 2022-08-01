'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const moment = require('moment')
const { expect } = require('@hapi/code')
const mapper = require('../../../src/lib/mappers/company-contact')

const CompanyContact = require('../../../src/lib/models/company-contact')
const DateRange = require('../../../src/lib/models/date-range')
const Contact = require('../../../src/lib/models/contact-v2')

experiment('modules/billing/mappers/company-contact', () => {
  experiment('.crmToModel', () => {
    let mapped
    let row

    beforeEach(async () => {
      row = {
        companyContactId: '62f285a6-928e-4872-8d00-6eac5325522e',
        companyId: 'ffffe5d7-b2d4-4f88-b2f5-d0b497bc276f',
        roleId: '5774f9ac-94ef-4fa1-9d9c-8cda614d6f17',
        isDefault: true,
        emailAddress: null,
        startDate: '2006-03-10',
        endDate: null,
        dateCreated: '2020-05-06T14:20:56.425Z',
        dateUpdated: '2020-05-31T06:34:33.764Z',
        isTest: false,
        contact: {
          contactId: 'f9d3b35c-b55b-4af8-98a2-beb3c1323ee9',
          salutation: 'test-salutation',
          firstName: 'test-first-name',
          middleInitials: 'A B C',
          lastName: 'test-last-name',
          externalId: '1:123',
          dateCreated: '2020-05-06T14:20:56.424Z',
          dateUpdated: '2020-05-31T06:34:33.762Z',
          initials: null,
          isTest: false
        },
        role: {
          roleId: '5774f9ac-94ef-4fa1-9d9c-8cda614d6f17',
          name: 'billing',
          dateCreated: '2020-05-04T15:06:49.058Z',
          dateUpdated: '2020-05-04T15:06:49.058Z'
        }
      }

      mapped = mapper.crmToModel(row)
    })

    test('returns a CompanyContact instance', async () => {
      expect(mapped).to.be.instanceOf(CompanyContact)
    })

    test('has the mapped id', async () => {
      expect(mapped.id).to.equal(row.companyContactId)
    })

    test('has the mapped companyId', async () => {
      expect(mapped.companyId).to.equal(row.companyId)
    })

    test('has the mapped roleId', async () => {
      expect(mapped.roleId).to.equal(row.roleId)
    })

    test('has the mapped isDefault value', async () => {
      expect(mapped.isDefault).to.equal(row.isDefault)
    })

    test('has the expected date range values', async () => {
      const { dateRange } = mapped
      expect(dateRange instanceof DateRange).to.be.true()
      expect(dateRange.startDate).to.equal(row.startDate)
      expect(dateRange.endDate).to.equal(row.endDate)
    })

    test('has the mapped dateCreated value', async () => {
      expect(mapped.dateCreated).to.equal(moment(row.dateCreated))
    })

    test('has the mapped dateUpdated value', async () => {
      expect(mapped.dateUpdated).to.equal(moment(row.dateUpdated))
    })

    test('has the mapped contact', async () => {
      expect(mapped.contact).to.be.instanceOf(Contact)
      expect(mapped.contact.id).to.equal(row.contact.contactId)
      expect(mapped.contact.salutation).to.equal(row.contact.salutation)
      expect(mapped.contact.firstName).to.equal(row.contact.firstName)
      expect(mapped.contact.middleInitials).to.equal(row.contact.middleInitials)
      expect(mapped.contact.initials).to.equal(row.contact.initials)
      expect(mapped.contact.lastName).to.equal(row.contact.lastName)
    })

    test('has the mapped role', async () => {
      expect(mapped.role.id).to.equal(row.role.roleId)
    })

    test('handles the absence of the role', async () => {
      delete row.role
      mapped = mapper.crmToModel(row)
      expect(mapped.role).to.equal(undefined)
    })

    test('handles the absence of the contact', async () => {
      delete row.contact
      mapped = mapper.crmToModel(row)
      expect(mapped.contact).to.equal(undefined)
    })

    test('maps the contact id correctly if present', async () => {
      delete row.contact
      const { contact } = mapper.crmToModel({ ...row, contactId: '00000000-1111-1111-1111-000000000000' })
      expect(contact instanceof Contact).to.be.true()
      expect(contact.id).to.equal('00000000-1111-1111-1111-000000000000')
    })
  })
})
