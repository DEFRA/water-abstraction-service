'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code

// Things we need to stub
const config = require('../../../../../config')
const gotWithProxy = require('../../../../../src/lib/connectors/charge-module/lib/got-with-proxy')
const { logger } = require('../../../../../src/logger')

// Thing under test
const AccessTokenManager = require('../../../../../src/lib/connectors/charge-module/lib/AccessTokenManager')

experiment('AccessTokenManager', () => {
  const data = {
    cognitoHost: 'https://test-host',
    cognitoUsername: 'test-user',
    cognitoPassword: 'test-password',
    accessToken: 'test-token',
    expiresIn: 3600
  }

  let gotWithProxyStub
  let instance

  beforeEach(async () => {
    gotWithProxyStub = Sinon.stub(gotWithProxy, 'post')

    // We stub the logger just to silence it during testing
    Sinon.stub(logger, 'info')
  })

  afterEach(async () => {
    Sinon.restore()
  })

  experiment('#token()', () => {
    experiment('when there is an existing token', () => {
      beforeEach(async () => {
        gotWithProxyStub.onFirstCall().resolves({
          access_token: data.accessToken,
          expires_in: data.expiresIn
        })

        gotWithProxyStub.onSecondCall().resolves({
          access_token: 'i-am-the-second-token',
          expires_in: data.expiresIn
        })

        instance = new AccessTokenManager()
        await instance.token()
      })

      experiment('that has not expired', () => {
        experiment(' and it is not forced to refresh the token', () => {
          test('it does not make a second request', async () => {
            const result = await instance.token()

            expect(result).to.equal(data.accessToken)
            expect(gotWithProxyStub.calledOnce).to.be.true()
          })
        })

        experiment('and it is forced to refresh the token', () => {
          test('it makes a second request', async () => {
            const result = await instance.token(true)

            expect(result).to.equal('i-am-the-second-token')
            expect(gotWithProxyStub.calledTwice).to.be.true()
          })
        })
      })

      experiment('that has expired', () => {
        let clockFake

        beforeEach(async () => {
          const testDate = new Date(2031, 9, 21, 20, 31, 57)

          clockFake = Sinon.useFakeTimers(testDate)
        })

        afterEach(async () => {
          clockFake.restore()
        })

        test('it makes a second request', async () => {
          const result = await instance.token()

          expect(result).to.equal('i-am-the-second-token')
          expect(gotWithProxyStub.calledTwice).to.be.true()
        })
      })
    })

    experiment('when the request to AWS Cognito succeeds', () => {
      beforeEach(async () => {
        Sinon.stub(config.chargeModule.cognito, 'username').value(data.cognitoUsername)
        Sinon.stub(config.chargeModule.cognito, 'password').value(data.cognitoPassword)

        gotWithProxyStub.resolves({
          access_token: data.accessToken,
          expires_in: data.expiresIn
        })
      })

      test('returns the JWT', async () => {
        instance = new AccessTokenManager()
        const result = await instance.token()

        expect(result).to.equal(data.accessToken)
      })

      test('had set the auth headers correctly', async () => {
        instance = new AccessTokenManager()
        await instance.token()

        const [, { headers }] = gotWithProxyStub.lastCall.args

        expect(headers['content-type']).to.equal('application/x-www-form-urlencoded')
        // We know this is the Base64 encoded version of our test credentials
        expect(headers.authorization).to.equal('Basic dGVzdC11c2VyOnRlc3QtcGFzc3dvcmQ=')
      })
    })

    experiment('when the request to AWS Cognito fails', () => {
      beforeEach(async () => {
        gotWithProxyStub.rejects()
      })

      test('throws an exception', async () => {
        instance = new AccessTokenManager()

        await expect(instance.token()).to.reject()
      })
    })
  })
})
