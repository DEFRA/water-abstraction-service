'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const moment = require('moment')

const gotWithProxy = require('../../../../../src/lib/connectors/charge-module/lib/got-with-proxy')
const AccessTokenManager = require('../../../../../src/lib/connectors/charge-module/lib/AccessTokenManager')
const { logger } = require('../../../../../src/logger')
const config = require('../../../../../config')

const data = {
  cognitoHost: 'https://test-host',
  cognitoUsername: 'test-user',
  cognitoPassword: 'test-password',
  accessToken: 'test-token',
  expiresIn: 3600,
  refDate: '2020-01-01T00:00:00.000Z',
  futureDate: '3020-01-01T00:00:00.000Z'
}

experiment('lib/connectors/charge-module/lib/AccessTokenManager', () => {
  let instance, result

  beforeEach(async () => {
    sandbox.stub(gotWithProxy, 'post')
    sandbox.stub(logger, 'info')
    sandbox.stub(config.chargeModule.cognito, 'host').value(data.cognitoHost)
    sandbox.stub(config.chargeModule.cognito, 'username').value(data.cognitoUsername)
    sandbox.stub(config.chargeModule.cognito, 'password').value(data.cognitoPassword)

    instance = new AccessTokenManager()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.refreshAccessToken', () => {
    beforeEach(async () => {
      gotWithProxy.post.resolves({
        access_token: data.accessToken,
        expires_in: data.expiresIn
      })
      result = await instance.refreshAccessToken(data.refDate)
    })

    test('calls the POST endpoint with the correct uri', async () => {
      const [uri] = gotWithProxy.post.lastCall.args
      expect(uri).to.equal('https://test-host/oauth2/token')
    })

    test('calls the POST endpoint with the correct query params', async () => {
      const [, { searchParams }] = gotWithProxy.post.lastCall.args
      expect(searchParams).to.equal({
        grant_type: 'client_credentials'
      })
    })

    test('calls the POST endpoint with the correct headers', async () => {
      const [, { headers }] = gotWithProxy.post.lastCall.args
      expect(headers['content-type']).to.equal('application/x-www-form-urlencoded')
      expect(headers.authorization).to.equal('Basic dGVzdC11c2VyOnRlc3QtcGFzc3dvcmQ=')
    })

    test('sets the access token', async () => {
      expect(instance.accessToken).to.equal(data.accessToken)
    })

    test('resolves with the access token', async () => {
      expect(result).to.equal(data.accessToken)
    })

    test('sets the expiry time', async () => {
      expect(instance.expiresAt.toISOString()).to.equal('2020-01-01T01:00:00.000Z')
    })
  })

  experiment('.isTokenValid', () => {
    test('returns false if no access token', async () => {
      expect(instance.isTokenValid()).to.be.false()
      expect(logger.info.calledWith('no cognito token'))
    })

    test('returns false if token expired', async () => {
      instance.accessToken = data.accessToken
      instance.expiresAt = moment(data.refDate)
      expect(instance.isTokenValid()).to.be.false()
      expect(logger.info.calledWith('cognito token expired'))
    })

    test('returns true if token not expired', async () => {
      instance.accessToken = data.accessToken
      instance.expiresAt = moment(data.futureDate)
      expect(instance.isTokenValid()).to.be.true()
      expect(logger.info.calledWith('use existing cognito token'))
    })
  })
})
