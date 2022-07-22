'use strict'

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const notifyMapper = require('../../../src/lib/mappers/notify')

experiment('lib/mappers/notify', () => {
  experiment('.mapModelsToNotifyAddress', () => {
    test('returns a correctly formatted address', async () => {
      const address = {
        addressLine1: 'addressLine1',
        addressLine2: 'addressLine2',
        addressLine3: 'addressLine3',
        addressLine4: 'addressLine4',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        isUKAddress: true
      }
      const result = notifyMapper.mapModelsToNotifyAddress({ address })
      expect(result).to.equal({
        address_line_1: 'addressLine1',
        address_line_2: 'addressLine2',
        address_line_3: 'addressLine3',
        address_line_4: 'addressLine4',
        address_line_5: 'town',
        address_line_6: 'county',
        address_line_7: 'postcode'
      })
    })

    test('returns a correctly formatted address showing company', async () => {
      const address = {
        addressLine1: 'addressLine1',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        isUKAddress: true
      }
      const company = {
        name: 'a company'
      }
      const result = notifyMapper.mapModelsToNotifyAddress({ address, company })
      expect(result).to.equal({
        address_line_1: 'a company',
        address_line_2: 'addressLine1',
        address_line_3: 'town',
        address_line_4: 'county',
        address_line_5: 'postcode'
      })
    })

    test('returns a correctly formatted address showing contact', async () => {
      const address = {
        addressLine1: 'addressLine1',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        isUKAddress: true
      }
      const contact = {
        fullName: 'testy mctester',
        dataSource: 'dataSource'
      }
      const result = notifyMapper.mapModelsToNotifyAddress({ address, contact })
      expect(result).to.equal({
        address_line_1: 'FAO testy mctester',
        address_line_2: 'addressLine1',
        address_line_3: 'town',
        address_line_4: 'county',
        address_line_5: 'postcode'
      })
    })

    test('returns a correctly formatted address showing company when contact also exists', async () => {
      const address = {
        addressLine1: 'addressLine1',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        isUKAddress: true
      }
      const company = {
        name: 'a company'
      }
      const contact = {
        fullName: 'testy mctester',
        dataSource: 'dataSource'
      }
      const result = notifyMapper.mapModelsToNotifyAddress({ address, company, contact })
      expect(result).to.equal({
        address_line_1: 'a company',
        address_line_2: 'FAO testy mctester',
        address_line_3: 'addressLine1',
        address_line_4: 'town',
        address_line_5: 'county',
        address_line_6: 'postcode'
      })
    })

    test('returns a correctly formatted address without showing contact', async () => {
      const address = {
        addressLine1: 'addressLine1',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        isUKAddress: true
      }
      const contact = {
        fullName: 'testy mctester',
        dataSource: 'nald'
      }
      const result = notifyMapper.mapModelsToNotifyAddress({ address, contact })
      expect(result).to.equal({
        address_line_1: 'addressLine1',
        address_line_2: 'town',
        address_line_3: 'county',
        address_line_4: 'postcode'
      })
    })

    test('returns a correctly formatted address with concatenated lines', async () => {
      const address = {
        addressLine1: 'addressLine1',
        addressLine2: 'addressLine2',
        addressLine3: 'addressLine3',
        addressLine4: 'addressLine4',
        town: 'town',
        county: 'county',
        postcode: 'postcode',
        country: 'country',
        isUKAddress: false
      }
      const company = {
        name: 'company name'
      }
      const contact = {
        fullName: 'contact name',
        dataSource: 'dataSource'
      }
      const result = notifyMapper.mapModelsToNotifyAddress({ address, company, contact })
      expect(result).to.equal({
        address_line_1: 'company name',
        address_line_2: 'FAO contact name',
        address_line_3: 'addressLine1',
        address_line_4: 'addressLine2, addressLine3',
        address_line_5: 'town',
        address_line_6: 'postcode',
        address_line_7: 'country'
      })
    })
  })
})
