const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { stringifyValues } = require('../../src/lib/stringify-values')

experiment('stringifyValues', () => {
  test('converts object values to JSON', async () => {
    const result = stringifyValues({
      key: { foo: 'bar' }
    })
    expect(result.key).to.equal('{"foo":"bar"}')
  })

  test('converts array values to JSON', async () => {
    const result = stringifyValues({
      key: [1, 2]
    })
    expect(result.key).to.equal('[1,2]')
  })

  test('does not alter other types', async () => {
    const data = {
      num: 1,
      str: 'test',
      null: null
    }
    const result = stringifyValues(data)
    expect(result).to.equal(data)
  })
})
