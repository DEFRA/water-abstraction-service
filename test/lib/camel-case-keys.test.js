const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const camelCaseKeys = require('../../src/lib/camel-case-keys')

experiment('lib/camel-case-keys', () => {
  experiment('for an array of strings', () => {
    test('the strings are kept at their orignal value', async () => {
      const input = ['one', 'two']
      expect(camelCaseKeys(input)).to.equal(input)
    })
  })

  experiment('primitive values', () => {
    test('handles null', async () => {
      const input = null
      expect(camelCaseKeys(input)).to.equal(null)
    })

    test('handles undefined', async () => {
      const input = undefined
      expect(camelCaseKeys(input)).to.equal(undefined)
    })

    test('handles arrays of numbers', async () => {
      const input = [1, 2, 3, 4, 5]
      expect(camelCaseKeys(input)).to.equal(input)
    })

    test('handles mixed arrays', async () => {
      const input = [1, 'two', false, true, Symbol('hello')]
      expect(camelCaseKeys(input)).to.equal(input)
    })
  })

  experiment('for an object', () => {
    test('all keys are transformed to camel case', async () => {
      const input = {
        snake_case: 'slither',
        'kebab-case': 'meaty'
      }

      expect(camelCaseKeys(input)).to.equal({
        snakeCase: 'slither',
        kebabCase: 'meaty'
      })
    })
  })

  experiment('for a nested object', () => {
    test('all keys are transformed to camel case', async () => {
      const input = {
        'top-level': {
          middle_level: {
            bottom_level: {
              'bottom-one': 1,
              bottom_two: 2
            },
            'middle-one': 1,
            middle_two: 2
          },
          'top-one': 1,
          top_two: 2
        }
      }

      expect(camelCaseKeys(input)).to.equal({
        topLevel: {
          middleLevel: {
            bottomLevel: {
              bottomOne: 1,
              bottomTwo: 2
            },
            middleOne: 1,
            middleTwo: 2
          },
          topOne: 1,
          topTwo: 2
        }
      })
    })
  })

  experiment('for an array of objects', () => {
    test('all object keys are transformed to camel case', async () => {
      const input = [
        { snake_case: 'slither' },
        { 'kebab-case': 'meaty' }
      ]

      expect(camelCaseKeys(input)).to.equal([
        { snakeCase: 'slither' },
        { kebabCase: 'meaty' }
      ])
    })
  })

  experiment('for an array of nested objects', () => {
    test('all object keys are transformed to camel case', async () => {
      const input = [
        {
          'road-bike': {
            type: 'road',
            wheels: 2,
            gears: {
              chain_rings: 2,
              rear_cassette: 11
            },
            groupset_brands: [
              { name: 'Sram', country_of_origin: 'USA' },
              { name: 'Shimano', country_of_origin: 'Japan' },
              { name: 'Campagnolo', country_of_origin: 'Italy' }
            ]
          }
        },
        {
          'moutain-bike': {
            type: 'mtb',
            wheels: 2,
            gears: {
              chain_rings: 1,
              rear_cassette: 12
            },
            groupset_brands: [
              { name: 'Sram', country_of_origin: 'USA' },
              { name: 'Shimano', country_of_origin: 'Japan' }
            ]
          }
        }
      ]

      expect(camelCaseKeys(input)).to.equal([
        {
          roadBike: {
            type: 'road',
            wheels: 2,
            gears: {
              chainRings: 2,
              rearCassette: 11
            },
            groupsetBrands: [
              { name: 'Sram', countryOfOrigin: 'USA' },
              { name: 'Shimano', countryOfOrigin: 'Japan' },
              { name: 'Campagnolo', countryOfOrigin: 'Italy' }
            ]
          }
        },
        {
          moutainBike: {
            type: 'mtb',
            wheels: 2,
            gears: {
              chainRings: 1,
              rearCassette: 12
            },
            groupsetBrands: [
              { name: 'Sram', countryOfOrigin: 'USA' },
              { name: 'Shimano', countryOfOrigin: 'Japan' }
            ]
          }
        }
      ])
    })
  })

  experiment('for an array of arrays', () => {
    test('all object keys are transformed to camel case', async () => {
      const input = [
        [{ first_object: 1 }, { second_object: 2 }],
        [{ third_object: 3 }, { fourth_object: 4 }]
      ]

      expect(camelCaseKeys(input)).to.equal([
        [{ firstObject: 1 }, { secondObject: 2 }],
        [{ thirdObject: 3 }, { fourthObject: 4 }]
      ])
    })
  })
})
