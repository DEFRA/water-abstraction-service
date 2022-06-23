const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { parseRequest, getConfig } = require('../../../../src/modules/returns-notifications/lib/request-parser.js')

experiment('getConfig', () => {
  test('returns a default config object', async () => {
    const result = getConfig()
    expect(result).to.equal({
      rolePriority: ['returns_to', 'licence_holder'],
      prefix: 'RFORM-'
    })
  })

  test('allows the defaults to be overridden', async () => {
    const result = getConfig({
      rolePriority: ['licence_holder'],
      prefix: 'CUSTOM-'
    })
    expect(result).to.equal({
      rolePriority: ['licence_holder'],
      prefix: 'CUSTOM-'
    })
  })
})

experiment('Test parseRequest', () => {
  const request = {
    params: {
      notificationId: 'pdf.return'
    },
    payload: {
      filter: {
        return_id: 'abc'
      },
      issuer: 'mail@example.com',
      name: 'Friendly name',
      config: {
        rolePriority: ['returns_to', 'licence_holder'],
        prefix: 'RFORM-'
      }
    }
  }

  test('parseRequest should parse the request into variables used by the controller', async () => {
    const result = parseRequest(request)
    expect(result).to.equal({
      messageRef: 'pdf.return',
      filter: { return_id: 'abc' },
      issuer: 'mail@example.com',
      name: 'Friendly name',
      columns: ['return_id', 'licence_ref'],
      sort: {},
      config: request.payload.config
    })
  })
})
