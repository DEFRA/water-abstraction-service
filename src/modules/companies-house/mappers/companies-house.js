'use strict'

const { omitBy } = require('lodash')

const Company = require('../../../lib/models/company')
const Address = require('../../../lib/models/address')
const Pagination = require('../../../lib/models/pagination')

const organisationTypeMap = new Map()
organisationTypeMap.set('ltd', Company.ORGANISATION_TYPES.limitedCompany)
organisationTypeMap.set('llp', Company.ORGANISATION_TYPES.limitedLiabilityPartnership)
organisationTypeMap.set('plc', Company.ORGANISATION_TYPES.publicLimitedCompany)

const mapCompanyType = companyType => organisationTypeMap.get(companyType)

/**
 * Maps a companies house address to an Address service model
 * @param {Object} data
 * @return {Address}
 */
const mapAddress = data => {
  const address = new Address()

  const obj = {
    addressLine1: data.po_box,
    addressLine2: data.premises,
    addressLine3: data.address_line_1,
    addressLine4: data.address_line_2,
    town: data.locality,
    county: data.region,
    postcode: data.postal_code,
    country: data.country || 'United Kingdom',
    source: Address.ADDRESS_SOURCE.companiesHouse
  }

  return address.fromHash(omitBy(obj, (value) => {
    return !value
  }))
}

/**
 * Maps companies house company to a Company instance
 * @param {Object} item
 * @return {Company}
 */
const mapCompany = item => {
  const company = new Company()
  const organisationType = mapCompanyType(item.company_type || item.type)
  return company.fromHash({
    name: item.title || item.company_name,
    type: Company.COMPANY_TYPES.organisation,
    companyNumber: item.company_number,
    ...organisationType && { organisationType }
  })
}

/**
 * Maps companies house API response to a Pagination service model
 * @param {Object} response Companies house API response
 * @return {Pagination}
 */
const mapPagination = response => {
  const pagination = new Pagination()
  return pagination.fromHash({
    page: response.page_number,
    perPage: response.items_per_page,
    totalRows: response.total_results,
    pageCount: Math.ceil(response.total_results / response.items_per_page)
  })
}

/**
 * Maps a search result item to a company/contact/address
 * @param {Object} item
 */
const mapItem = item => {
  return {
    company: mapCompany(item),
    address: mapAddress(item.address)
  }
}

exports.mapPagination = mapPagination
exports.mapItem = mapItem
exports.mapCompany = mapCompany
exports.mapAddress = mapAddress
