const server = require('../../index')

const { experiment, test, beforeEach, before } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

experiment('/status', () => {
  let response

  before(async () => {
    await server._start()
  })

  beforeEach(async () => {
    const request = { method: 'get', url: '/status' }
    response = await server.inject(request)
  })

  test('responds with a status code of 200', async () => {
    expect(response.statusCode).to.equal(200)
  })

  test('responds with an object containing the application version', async () => {
    expect(response.result.version).to.match(/\d*\.\d*\.\d*/g)
  })
})
