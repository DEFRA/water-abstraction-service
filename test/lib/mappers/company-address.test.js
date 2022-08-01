'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const CompanyAddress = require('../../../src/lib/models/company-address')
const DateRange = require('../../../src/lib/models/date-range')
const Address = require('../../../src/lib/models/address')

const companyAddressMapper = require('../../../src/lib/mappers/company-address')

const dbRow = {
  companyAddressId: '00000000-0000-0000-0000-000000000000',
  companyId: '00000000-1111-1111-1111-000000000000',
  startDate: '2018-01-01',
  endDate: '2020-04-01',
  isDefault: true
}

experiment('modules/billing/mappers/company-address', () => {
  experiment('.crmToModel', () => {
    let result

    beforeEach(async () => {
      result = companyAddressMapper.crmToModel(dbRow)
    })

    test('returns an CompanyAddress instance', async () => {
      expect(result instanceof CompanyAddress).to.be.true()
    })

    test('has the expected id value', async () => {
      expect(result.id).to.equal(dbRow.companyAddressId)
    })

    test('has the expected company id value', async () => {
      expect(result.companyId).to.equal(dbRow.companyId)
    })

    test('has the expected date range values', async () => {
      const { dateRange } = result
      expect(dateRange instanceof DateRange).to.be.true()
      expect(dateRange.startDate).to.equal(dbRow.startDate)
      expect(dateRange.endDate).to.equal(dbRow.endDate)
    })

    experiment('roleName', () => {
      test('is not mapped if it is not present', async () => {
        expect(result.roleName).to.be.undefined()
      })

      test('has the expected role name value if present', async () => {
        const result = companyAddressMapper.crmToModel({ ...dbRow, role: { name: 'billing' } })
        expect(result.roleName).to.equal('billing')
      })
    })

    experiment('address', () => {
      const addressData = {
        addressId: '00000000-0000-0000-0000-000000000000',
        address1: 'address 1',
        address2: 'address 2',
        address3: 'address 3',
        address4: 'address 4',
        town: 'town',
        county: 'county',
        postcode: 'AB12 3CD',
        country: 'country'
      }

      test('is not mapped if it is not present', async () => {
        expect(result.address).to.be.undefined()
      })

      test('has the expected address value if present', async () => {
        const { address } = companyAddressMapper.crmToModel({ ...dbRow, address: addressData })
        expect(address instanceof Address).to.be.true()
        expect(address.id).to.equal(addressData.addressId)
        expect(address.addressLine1).to.equal(addressData.address1)
        expect(address.addressLine2).to.equal(addressData.address2)
        expect(address.addressLine3).to.equal(addressData.address3)
        expect(address.addressLine4).to.equal(addressData.address4)
        expect(address.town).to.equal(addressData.town)
        expect(address.county).to.equal(addressData.county)
        expect(address.postcode).to.equal(addressData.postcode)
        expect(address.country).to.equal(addressData.country)
      })
    })

    test('maps the address id correctly if present', async () => {
      const { address } = companyAddressMapper.crmToModel({ ...dbRow, addressId: '00000000-1111-1111-1111-000000000000' })
      expect(address instanceof Address).to.be.true()
      expect(address.id).to.equal('00000000-1111-1111-1111-000000000000')
    })
  })
})
