const { expect } = require('@hapi/code')
const { experiment, test } = exports.lab = require('@hapi/lab').script()

const naldHelpers = require('../../../src/lib/licence-transformer/nald-helpers')

experiment('createUniqueId', () => {
  test('creates the expected string', async () => {
    const id = 1
    const regionCode = 8
    const type = 'points'

    const result = naldHelpers.createUniqueId(type, regionCode, id)
    expect(result).to.equal('nald://points/8/1')
  })
})

experiment('parseUniqueId', () => {
  test('the id is extracted', async () => {
    const input = 'nald://conditions/8/123'
    const id = naldHelpers.parseUniqueId(input).id
    expect(id).to.equal('123')
  })

  test('can handle ids that contain slashes', async () => {
    const input = 'nald://licences/8/123/S*/45/6789'
    const id = naldHelpers.parseUniqueId(input).id
    expect(id).to.equal('123/S*/45/6789')
  })

  test('the regionCode is extracted', async () => {
    const input = 'nald://points/2/123'
    const id = naldHelpers.parseUniqueId(input).regionCode
    expect(id).to.equal('2')
  })

  test('the type is extracted', async () => {
    const input = 'nald://conditions/8/123'
    const id = naldHelpers.parseUniqueId(input).type
    expect(id).to.equal('conditions')
  })
})

experiment('getFullName', () => {
  test('It should return a full name using initials if first name empty', async () => {
    const str = naldHelpers.getFullName('Mr', 'J', null, 'Doe')
    expect(str).to.equal('Mr J Doe')
  })

  test('It should return a full name using initials if first name is defined', async () => {
    const str = naldHelpers.getFullName('Mr', 'J', 'John', 'Doe')
    expect(str).to.equal('Mr J Doe')
  })

  test('It should return a full name if salutation is emtpy', async () => {
    const str = naldHelpers.getFullName(null, 'J', 'John', 'Doe')
    expect(str).to.equal('J Doe')
  })

  test('It should return a full name if initials are emtpy', async () => {
    const str = naldHelpers.getFullName('Mr', null, 'John', 'Doe')
    expect(str).to.equal('Mr John Doe')
  })

  test('It should return a company name', async () => {
    const str = naldHelpers.getFullName(null, null, null, 'Company Ltd')
    expect(str).to.equal('Company Ltd')
  })
})

experiment('getAggregateQuantities', () => {
  const getPurpose = (hasNull = false) => {
    return {
      ANNUAL_QTY: 1000,
      DAILY_QTY: 50,
      HOURLY_QTY: hasNull ? null : 25,
      INST_QTY: 3
    }
  }

  test('It should get formatted quantities from a purposes', async () => {
    const result = naldHelpers.getAggregateQuantities(getPurpose(false))
    expect(result).to.equal([
      { name: 'cubic metres per year', value: 1000 },
      { name: 'cubic metres per day', value: 50 },
      { name: 'cubic metres per hour', value: 25 },
      { name: 'litres per second', value: 3 }
    ])
  })

  test('It should omit a value if it is null', async () => {
    const result = naldHelpers.getAggregateQuantities(getPurpose(true))
    const names = result.map(row => row.name)
    expect(names).to.only.include([
      'cubic metres per year',
      'cubic metres per day',
      'litres per second'
    ])
  })
})
