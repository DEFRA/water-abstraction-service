const { v4: uuid } = require('uuid')

const {
  experiment,
  test,
  beforeEach,
  afterEach,
  before
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { server, start } = require('../../index.js')

const createRequest = (method, sessionId) => {
  const url = `/water/1.0/sessions${sessionId ? '/' + sessionId : ''}`
  return {
    method,
    url,
    headers: { Authorization: process.env.JWT_TOKEN }
  }
}

const deleteSession = async sessionId => {
  const request = createRequest('DELETE', sessionId)
  const response = await server.inject(request)
  return response
}

experiment('controllers/sessions', () => {
  let response
  let sessionId

  before(async () => {
    await start()
  })

  beforeEach(async () => {
    sessionId = uuid()

    const request = createRequest('POST')
    request.payload = {
      ip: '127.0.0.1',
      session_id: sessionId,
      session_data: '{"user_id" : 1234}'
    }

    response = await server.inject(request)
  })

  afterEach(async () => {
    await deleteSession(sessionId)
  })

  test('The API should create a new session with POST', async () => {
    // Check payload
    const payload = JSON.parse(response.payload)
    expect(payload.data.session_id).to.equal(sessionId)
  })

  // Create session
  test('The API should GET a session by ID', async () => {
    const request = createRequest('GET', sessionId)
    const res = await server.inject(request)

    // Check payload
    expect(res.statusCode).to.equal(200)
    const payload = JSON.parse(res.payload)
    expect(payload.data.session_id).to.equal(sessionId)
  })

  // Delete session
  test('The API should delete a session with DELETE', async () => {
    const request = createRequest('DELETE', sessionId)
    const res = await server.inject(request)
    expect(res.statusCode).to.equal(200)
  })
})
