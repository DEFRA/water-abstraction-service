const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { expect, fail } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const idmConnector = require('../../../src/lib/connectors/idm')
const helpers = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const { assertIsUuid } = require('../../custom-assertions')

experiment('connectors/idm', () => {
  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'get').resolves({
      version: '0.0.1'
    })

    sandbox.stub(idmConnector.usersClient, 'findMany').resolves({
      data: [],
      error: null
    })

    sandbox.stub(idmConnector.usersClient, 'create')

    sandbox.stub(idmConnector.usersClient, 'updateMany')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getUsersByExternalId', () => {
    experiment('when externalIds array is empty', () => {
      const externalIds = []

      test('the API is not called', async () => {
        await idmConnector.usersClient.getUsersByExternalId(externalIds)
        expect(idmConnector.usersClient.findMany.callCount).to.equal(0)
      })

      test('returns an object with empty data array', async () => {
        const result = await idmConnector.usersClient.getUsersByExternalId(externalIds)
        expect(result).to.equal({ data: [] })
      })
    })

    experiment('when externalIds is not empty', () => {
      const externalIds = [1, 2, 3, 4]
      beforeEach(async () => {
        await idmConnector.usersClient.getUsersByExternalId(externalIds)
      })

      test('uses the expected filter', async () => {
        const [filter] = idmConnector.usersClient.findMany.lastCall.args
        expect(filter).to.equal({
          external_id: {
            $in: externalIds
          },
          application: 'water_vml'
        })
      })
    })
  })

  experiment('.getUserByUsername', () => {
    const userName = 'testing@example.com'

    beforeEach(async () => {
      idmConnector.usersClient.findMany.resolves({
        data: [{ user_id: 123 }],
        error: null
      })
    })

    test('uses the expected filter', async () => {
      await idmConnector.usersClient.getUserByUsername(userName, 'water_vml')
      const [filter] = idmConnector.usersClient.findMany.lastCall.args
      expect(filter).to.equal({
        user_name: userName,
        application: 'water_vml'
      })
    })

    test('returns the expected data', async () => {
      idmConnector.usersClient.findMany.resolves({
        data: [{ user_id: 123 }],
        error: null
      })

      const user = await idmConnector.usersClient.getUserByUsername(userName, 'water_vml')
      expect(user.user_id).to.equal(123)
    })

    test('returns undefined when the user is not found', async () => {
      idmConnector.usersClient.findMany.resolves({
        data: [],
        error: null
      })

      const user = await idmConnector.usersClient.getUserByUsername(userName, 'water_vml')
      expect(user).to.be.undefined()
    })

    test('throws if an error is returned', async () => {
      idmConnector.usersClient.findMany.resolves({
        error: { name: 'User not found' },
        data: []
      })

      try {
        await idmConnector.usersClient.getUserByUsername(userName, 'water_vml')
        fail('Should never get here')
      } catch (err) {
        expect(err).to.exist()
      }
    })

    test('throws for an unexpected application', async () => {
      const err = await expect(idmConnector.usersClient.getUserByUsername(userName, 'not-an-application')).to.reject()
      expect(err.name).to.equal('ValidationError')
      expect(err.isJoi).to.be.true()
    })
  })

  experiment('.getServiceVersion', () => {
    test('calls the expected URL', async () => {
      await idmConnector.getServiceVersion()
      const [url] = helpers.serviceRequest.get.lastCall.args
      expect(url).to.endWith('/status')
    })
  })

  experiment('.createUser', () => {
    test('throws for an unexpected application', async () => {
      const err = await expect(idmConnector.usersClient.createUser(
        'test@example.com',
        'not-an-application',
        '00000000-0000-0000-0000-000000000000'
      )).to.reject()

      expect(err.name).to.equal('ValidationError')
      expect(err.isJoi).to.be.true()
    })

    experiment('with valid arguments', () => {
      let createData
      let createdUser

      beforeEach(async () => {
        idmConnector.usersClient.create.resolves({
          data: {
            user_id: 100,
            user_name: 'test@example.com'
          },
          error: null
        })

        createdUser = await idmConnector.usersClient.createUser(
          'test@example.com',
          'water_admin',
          '00000000-0000-0000-0000-000000000000'
        )

        createData = idmConnector.usersClient.create.lastCall.args[0]
      })

      test('passes the new username to the IDM', async () => {
        expect(createData.user_name).to.equal('test@example.com')
      })

      test('passes a UUID for the password to the IDM', async () => {
        assertIsUuid(createData.password)
      })

      test('passes a UUID for the reset_guid to the IDM', async () => {
        assertIsUuid(createData.reset_guid)
      })

      test('passes a reset_required value of 1 to the IDM', async () => {
        expect(createData.reset_required).to.equal(1)
      })

      test('passes the application to the IDM', async () => {
        expect(createData.application).to.equal('water_admin')
      })

      test('passes the external_id to the IDM', async () => {
        expect(createData.external_id).to.equal('00000000-0000-0000-0000-000000000000')
      })

      test('passes a bad_logins value of 0 to the IDM', async () => {
        expect(createData.bad_logins).to.equal(0)
      })

      test('passes a reset_guid_date_created value to the IDM', async () => {
        expect(createData.reset_guid_date_created).to.be.a.date()
      })

      test('returns the created user without the data envelope', async () => {
        expect(createdUser.user_id).to.equal(100)
      })
    })
  })

  experiment('.disableUser', () => {
    beforeEach(async () => {
      idmConnector.usersClient.updateMany.resolves({
        error: null,
        data: [{
          user_id: 123
        }]
      })
    })

    test('calls usersClient.updateMany with correct params', async () => {
      await idmConnector.usersClient.disableUser(123, 'water_vml')
      const [filter, data] = idmConnector.usersClient.updateMany.lastCall.args

      expect(filter).to.equal({
        user_id: 123,
        application: 'water_vml',
        enabled: true
      })
      expect(data).to.equal({
        enabled: false
      })
    })

    test('throws error if API error response', async () => {
      idmConnector.usersClient.updateMany.resolves({ error: 'some error' })
      const func = () => idmConnector.usersClient.disableUser(123, 'water_vml')
      expect(func()).to.reject()
    })

    test('resolves with updated user', async () => {
      const result = await idmConnector.usersClient.disableUser(123, 'water_vml')
      expect(result.user_id).to.equal(123)
    })
  })

  experiment('.enableUser', () => {
    beforeEach(async () => {
      idmConnector.usersClient.updateMany.resolves({
        error: null,
        data: [{
          user_id: 123
        }]
      })
    })

    test('calls usersClient.updateMany with correct params', async () => {
      await idmConnector.usersClient.enableUser(123, 'water_vml')
      const [filter, data] = idmConnector.usersClient.updateMany.lastCall.args

      expect(filter).to.equal({
        user_id: 123,
        application: 'water_vml',
        enabled: false
      })
      expect(data).to.equal({
        enabled: true
      })
    })
  })
})

experiment('startEmailChange', () => {
  const userId = 123
  const email = 'mail@example.com'

  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'post').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('passes the expected URL and params to the request', async () => {
    await idmConnector.startEmailChange(userId, email)
    const [url, options] = helpers.serviceRequest.post.lastCall.args
    expect(url).to.equal(`${config.services.idm}/user/${userId}/change-email-address`)
    expect(options).to.equal({
      body: {
        email
      }
    })
  })
})

experiment('verifySecurityCode', () => {
  const userId = 123
  const securityCode = '012345'

  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'post').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('passes the expected URL and params to the request', async () => {
    await idmConnector.verifySecurityCode(userId, securityCode)
    const [url, options] = helpers.serviceRequest.post.lastCall.args
    expect(url).to.equal(`${config.services.idm}/user/${userId}/change-email-address/code`)
    expect(options).to.equal({
      body: {
        securityCode
      }
    })
  })
})

experiment('getEmailChangeStatus', () => {
  const userId = 123

  beforeEach(async () => {
    sandbox.stub(helpers.serviceRequest, 'get').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('passes the expected URL to the request', async () => {
    await idmConnector.getEmailChangeStatus(userId)
    const [url] = helpers.serviceRequest.get.lastCall.args
    expect(url).to.equal(`${config.services.idm}/user/${userId}/change-email-address`)
  })
})
