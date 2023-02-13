'use strict'

const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const controller = require('../../../src/modules/users/controller')
const idmConnector = require('../../../src/lib/connectors/idm')
const userRolesConnector = require('../../../src/lib/connectors/idm/user-roles')
const crmEntitiesConnector = require('../../../src/lib/connectors/crm/entities')
const crmDocumentsConnector = require('../../../src/lib/connectors/crm/documents')
const config = require('../../../config')
const emailNotifications = require('../../../src/lib/notifications/emails')
const { getRolesForPermissionKey } = require('../../../src/lib/roles')
const event = require('../../../src/lib/event')
const licencesService = require('../../../src/lib/services/licences')
const Licence = require('../../../src/lib/models/licence')
const { logger } = require('../../../src/logger')

const getUserResponse = () => ({
  error: null,
  data: {
    user_id: 2037,
    user_name: 'test@example.com',
    reset_required: '0',
    last_login: '2019-01-24T17:07:54.000Z',
    date_updated: '2019-02-23T17:07:54.000Z',
    role: { scopes: ['external'] },
    external_id: 'user-external-id',
    enabled: true
  }
})

const getCompaniesResponse = () => ({
  data: {
    entityId: 'user_external_id',
    entityName: 'test@example.com',
    companies: [
      {
        userRoles: ['primary_user'],
        entityId: 'wet_and_wild_id',
        name: 'Wet and Wild'
      },
      {
        userRoles: ['user', 'user_returns'],
        entityId: 'max_irrigation_id',
        name: 'Max Irrigation'
      }
    ]
  },
  error: null
})

const getVerificationsResponse = () => ({
  data: [
    {
      id: 'verification_one_id',
      companyEntityId: 'wet_and_wild_id',
      code: 'test_code_1',
      dateCreated: '2017-01-01T00:00:00.000Z',
      documents: [
        { licenceRef: 'lic_1', documentId: 'lic_1_document_id' },
        { licenceRef: 'lic_2', documentId: 'lic_2_document_id' }
      ]
    },
    {
      id: 'verification_two_id',
      companyEntityId: 'max_irrigation_id',
      code: 'test_code_2',
      dateCreated: '2018-01-01T00:00:00.000Z',
      documents: [
        { licenceRef: 'lic_3', documentId: 'lic_3_document_id' }
      ]
    }
  ],
  error: null
})

const getDocumentHeaderResponse = () => ({
  data: [
    {
      document_id: 'lic_1_document_id',
      system_external_id: '01/123',
      metadata: {
        Name: 'Wet and Wild',
        contacts: [
          { name: 'Wet and Wild LH', role: 'Licence holder' },
          { name: 'Wet and Wild Other', role: 'other role' }
        ]
      },
      company_entity_id: 'wet_and_wild_id'
    },
    {
      document_id: 'lic_2_document_id',
      system_external_id: '02/345',
      metadata: {
        Name: 'Wet and Wild',
        contacts: [
          { name: 'Wet and Wild LH', role: 'Licence holder' },
          { name: 'Wet and Wild Other', role: 'other role' }
        ]
      },
      company_entity_id: 'wet_and_wild_id'
    },
    {
      document_id: 'lic_3_document_id',
      system_external_id: '03/456',
      metadata: {
        Name: 'Max Irrigation'
      },
      company_entity_id: 'max_irrigation_id'
    }
  ],
  error: null
})

const getLicence = licenceNumber => new Licence().fromHash({
  licenceNumber
})

experiment('modules/users/controller', () => {
  const licences = [
    getLicence('01/123'),
    getLicence('02/345'),
    getLicence('03/456')
  ]

  beforeEach(async () => {
    sandbox.stub(idmConnector.usersClient, 'findOne')
    sandbox.stub(idmConnector.usersClient, 'getUserByUsername')
    sandbox.stub(idmConnector.usersClient, 'createUser')
    sandbox.stub(idmConnector.usersClient, 'enableUser')
    sandbox.stub(idmConnector.usersClient, 'disableUser')
    sandbox.stub(crmEntitiesConnector, 'getOrCreateInternalUserEntity')
    sandbox.stub(emailNotifications, 'sendNewInternalUserMessage')
    sandbox.stub(userRolesConnector, 'setInternalUserRoles')
    sandbox.stub(event, 'save')
    sandbox.stub(licencesService, 'getLicencesByLicenceRefs')
    sandbox.stub(logger, 'info')
    sandbox.stub(logger, 'error')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('getStatus', () => {
    beforeEach(async () => {
      idmConnector.usersClient.findOne.resolves(getUserResponse())
      sandbox.stub(crmEntitiesConnector, 'getEntityCompanies').resolves(getCompaniesResponse())
      sandbox.stub(crmEntitiesConnector, 'getEntityVerifications').resolves(getVerificationsResponse())
      sandbox.stub(crmDocumentsConnector, 'findMany').resolves(getDocumentHeaderResponse())
      sandbox.stub(crmDocumentsConnector, 'findAll').resolves(getDocumentHeaderResponse().data)
      licencesService.getLicencesByLicenceRefs.resolves(licences)
    })

    test('passes the expected user id to the idm connector', async () => {
      const request = { params: { id: 123 } }
      await controller.getStatus(request)
      const idmArgs = idmConnector.usersClient.findOne.args[0][0]
      expect(idmArgs).to.equal(123)
    })

    test('format user section as required', async () => {
      const request = { params: { id: 123 } }
      const response = await controller.getStatus(request)
      const user = response.data.user
      expect(user).to.equal({
        isLocked: false,
        isInternal: false,
        isDisabled: false,
        dateDisabled: null,
        lastLogin: '2019-01-24T17:07:54.000Z',
        userName: 'test@example.com'
      })
    })

    test('identifies a locked account', async () => {
      const request = { params: { id: 123 } }
      const testResponse = getUserResponse()
      testResponse.data.reset_required = 1
      idmConnector.usersClient.findOne.resolves(testResponse)

      const response = await controller.getStatus(request)
      const user = response.data.user

      expect(user).to.equal({
        isLocked: true,
        isInternal: false,
        isDisabled: false,
        dateDisabled: null,
        lastLogin: '2019-01-24T17:07:54.000Z',
        userName: 'test@example.com'
      })
    })

    test('identifies an internal user', async () => {
      const request = { params: { id: 123 } }
      const testResponse = getUserResponse()
      testResponse.data.application = config.idm.application.internalUser
      idmConnector.usersClient.findOne.resolves(testResponse)

      const response = await controller.getStatus(request)
      const user = response.data.user

      expect(user).to.equal({
        isLocked: false,
        isInternal: true,
        isDisabled: false,
        dateDisabled: null,
        lastLogin: '2019-01-24T17:07:54.000Z',
        userName: 'test@example.com'
      })

      expect(response.data.companies).to.equal([])
    })

    test('identifies a disabled account', async () => {
      const request = { params: { id: 123 } }
      const testResponse = getUserResponse()
      testResponse.data.application = config.idm.application.internalUser
      testResponse.data.enabled = false
      idmConnector.usersClient.findOne.resolves(testResponse)

      const response = await controller.getStatus(request)
      const user = response.data.user

      expect(user).to.equal({
        isLocked: false,
        isInternal: true,
        isDisabled: true,
        dateDisabled: '2019-02-23T17:07:54.000Z',
        lastLogin: '2019-01-24T17:07:54.000Z',
        userName: 'test@example.com'
      })

      expect(response.data.companies).to.equal([])
    })

    test('passes the user entity id to the getEntitiesCompanies function', async () => {
      const request = { params: { id: 123 } }
      await controller.getStatus(request)
      const getCompaniesArgs = crmEntitiesConnector.getEntityCompanies.args[0][0]
      expect(getCompaniesArgs).to.equal(getUserResponse().data.external_id)
    })

    test('includes all the associated companies', async () => {
      const request = { params: { id: 123 } }

      const response = await controller.getStatus(request)
      const companies = response.data.companies
      expect(companies.length).to.equal(2)
    })

    test('the companies contain thier names', async () => {
      const request = { params: { id: 123 } }

      const response = await controller.getStatus(request)

      const companies = response.data.companies
      expect(companies.find(c => c.name === 'Wet and Wild')).to.exist()
      expect(companies.find(c => c.name === 'Max Irrigation')).to.exist()
    })

    test('the companies contain the user roles at the company', async () => {
      const request = { params: { id: 123 } }

      const response = await controller.getStatus(request)

      const companies = response.data.companies
      expect(companies.find(c => c.name === 'Wet and Wild').userRoles)
        .to
        .only
        .include(['primary_user'])

      expect(companies.find(c => c.name === 'Max Irrigation').userRoles)
        .to
        .only
        .include(['user', 'user_returns'])
    })

    test('the companies contain thier outstanding verifications', async () => {
      const request = { params: { id: 123 } }

      const response = await controller.getStatus(request)

      const companies = response.data.companies
      expect(companies.find(c => c.name === 'Wet and Wild').outstandingVerifications)
        .to.equal([
          {
            code: 'test_code_1',
            dateCreated: '2017-01-01T00:00:00.000Z',
            licences: [
              { licenceRef: 'lic_1', documentId: 'lic_1_document_id' },
              { licenceRef: 'lic_2', documentId: 'lic_2_document_id' }
            ]
          }
        ])

      expect(companies.find(c => c.name === 'Max Irrigation').outstandingVerifications)
        .to.equal([
          {
            code: 'test_code_2',
            dateCreated: '2018-01-01T00:00:00.000Z',
            licences: [{ licenceRef: 'lic_3', documentId: 'lic_3_document_id' }]
          }
        ])
    })

    test('uses the user entity id to fetch documents', async () => {
      const request = { params: { id: 123 } }
      await controller.getStatus(request)
      const getDocumentsArgs = crmDocumentsConnector.findAll.args[0][0]
      expect(getDocumentsArgs).to.equal({
        entity_id: getUserResponse().data.external_id
      })
    })

    test('adds the licence summary to each company', async () => {
      const request = { params: { id: 123 } }
      const response = await controller.getStatus(request)

      const companies = response.data.companies
      expect(companies.find(c => c.name === 'Wet and Wild').registeredLicences)
        .to.equal([
          {
            documentId: 'lic_1_document_id',
            licenceRef: '01/123',
            licenceHolder: 'Wet and Wild LH',
            licence: licences[0]
          },
          {
            documentId: 'lic_2_document_id',
            licenceRef: '02/345',
            licenceHolder: 'Wet and Wild LH',
            licence: licences[1]
          }
        ])

      expect(companies.find(c => c.name === 'Max Irrigation').registeredLicences)
        .to.equal([
          {
            documentId: 'lic_3_document_id',
            licenceRef: '03/456',
            licenceHolder: '',
            licence: licences[2]
          }
        ])
    })

    test('when no user is found a 404 is returned', async () => {
      const request = { params: { id: 123 } }
      idmConnector.usersClient.findOne.resolves({
        error: {
          name: 'NotFoundError'
        }
      })

      const response = await controller.getStatus(request)

      expect(response.output.statusCode).to.equal(404)
      expect(response.output.payload.message).to.equal('User not found')
    })

    test('only returns the user part when no external/enitity id is present', async () => {
      const request = { params: { id: 123 } }
      const testResponse = getUserResponse()
      testResponse.data.external_id = null
      idmConnector.usersClient.findOne.resolves(testResponse)

      const response = await controller.getStatus(request)
      const user = response.data.user

      expect(user).to.equal({
        isLocked: false,
        isInternal: false,
        isDisabled: false,
        dateDisabled: null,
        lastLogin: '2019-01-24T17:07:54.000Z',
        userName: 'test@example.com'
      })

      expect(response.data.companies).to.equal([])
    })
  })

  experiment('.postUserInternal', () => {
    let h
    let statusCodeSpy

    beforeEach(async () => {
      statusCodeSpy = sandbox.spy()

      h = {
        view: sandbox.spy(),
        response: sandbox.stub().returns({
          code: statusCodeSpy
        })
      }
    })

    experiment('validates the calling user', () => {
      const invalidRoles = [
        'unknown',
        'returns',
        'bulk_return_notifications',
        'unlink_licences',
        'renewal_notifications',
        'ar_user',
        'ar_approver',
        'hof_notifications'
      ]

      invalidRoles.forEach(role => {
        test(`invalid role of ${role} responds with 403`, async () => {
          idmConnector.usersClient.findOne.resolves({
            data: {
              user_id: 100,
              roles: [role]
            }
          })

          const request = {
            payload: {
              callingUserId: 100,
              newUserEmail: 'test@example.gov.uk'
            }
          }

          const response = await controller.postUserInternal(request, h)
          expect(response.output.statusCode).to.equal(403)
        })
      })
    })

    experiment('validates the proposed new user', () => {
      test('returns a conflict response if the new user already exists', async () => {
        const newUserEmail = 'test@example.gov.uk'
        const application = config.idm.application.internalUser

        idmConnector.usersClient.findOne.resolves({
          data: {
            user_id: 100,
            roles: ['manage_accounts']
          }
        })

        idmConnector.usersClient.getUserByUsername
          .withArgs(newUserEmail, application)
          .resolves({
            user_id: 200,
            user_name: newUserEmail
          })

        const request = {
          payload: {
            callingUserId: 100,
            newUserEmail
          }
        }

        const response = await controller.postUserInternal(request, h)
        expect(response.output.statusCode).to.equal(409)
      })
    })

    experiment('when the user can be created', () => {
      let newUserEmail
      let callingUserId
      let callingUserEmail
      let createdCrmEntityId

      beforeEach(async () => {
        newUserEmail = 'new-user@example.gov.uk'
        callingUserId = 123
        callingUserEmail = 'admin@example.govuk'
        createdCrmEntityId = '00000000-0000-0000-0000-000000000000'

        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: ['manage_accounts']
          }
        })

        // set up so that the proposed user does not already exist
        idmConnector.usersClient.getUserByUsername
          .withArgs(newUserEmail, 'water_admin')
          .resolves()

        crmEntitiesConnector.getOrCreateInternalUserEntity.resolves({
          entity_id: createdCrmEntityId,
          entity_name: newUserEmail
        })

        idmConnector.usersClient.createUser.resolves({
          user_id: 100,
          user_name: newUserEmail,
          reset_guid: '22222222-2222-2222-2222-222222222222'
        })

        // when setting the roles, the user in the response
        // contains the fully resolved roles and any groups.
        userRolesConnector.setInternalUserRoles.resolves({
          data: {
            user_id: 100,
            user_name: newUserEmail,
            reset_guid: '22222222-2222-2222-2222-222222222222',
            roles: [
              'returns',
              'bulk_return_notifications',
              'manage_accounts',
              'unlink_licences'
            ],
            groups: ['billing_and_data']
          }
        })

        event.save.resolves()
        emailNotifications.sendNewInternalUserMessage.resolves({})

        const request = {
          payload: {
            callingUserId,
            newUserEmail,
            permissionsKey: 'billing_and_data'
          }
        }
        await controller.postUserInternal(request, h)
      })

      test('the user is created in the CRM', async () => {
        const [userEmail, adminEmail] = crmEntitiesConnector.getOrCreateInternalUserEntity.lastCall.args
        expect(userEmail).to.equal(newUserEmail)
        expect(adminEmail).to.equal(callingUserEmail)
      })

      test('the user is created in the IDM', async () => {
        const [username, application, externalId] = idmConnector.usersClient.createUser.lastCall.args
        expect(username).to.equal(newUserEmail)
        expect(application).to.equal('water_admin')
        expect(externalId).to.equal(createdCrmEntityId)
      })

      test('the user roles and groups are set', async () => {
        const [userId, roles, groups] = userRolesConnector.setInternalUserRoles.lastCall.args
        expect(userId).to.equal(userId)
        expect(roles).to.equal(getRolesForPermissionKey('billing_and_data').roles)
        expect(groups).to.equal(getRolesForPermissionKey('billing_and_data').groups)
      })

      test('an email is sent to the new user', async () => {
        const [recipient, changePasswordLink] = emailNotifications.sendNewInternalUserMessage.lastCall.args
        expect(recipient).to.equal(newUserEmail)

        expect(changePasswordLink).to.equal(
          `${config.frontEnds.internal.baseUrl}/reset_password_change_password?resetGuid=22222222-2222-2222-2222-222222222222`
        )
      })

      test('an event is created for audit purposes', async () => {
        const [savedEvent] = event.save.lastCall.args
        expect(savedEvent.type).to.equal('new-user')
        expect(savedEvent.subtype).to.equal('internal')
        expect(savedEvent.issuer).to.equal(callingUserEmail)
        expect(savedEvent.metadata.user).to.equal(newUserEmail)
      })

      test('the new IDM user is returned in the response', async () => {
        const [body] = h.response.lastCall.args
        expect(body.user_id).to.equal(100)
        expect(body.user_name).to.equal(newUserEmail)
        expect(body.roles).to.equal([
          'returns',
          'bulk_return_notifications',
          'manage_accounts',
          'unlink_licences'
        ])

        expect(body.groups).to.equal(['billing_and_data'])
      })

      test('the response has a status code of 201 (created)', async () => {
        expect(statusCodeSpy.calledWith(201)).to.be.true()
      })
    })

    experiment('when a disabled user account already exists', () => {
      let newUserEmail
      let callingUserId
      let callingUserEmail

      beforeEach(async () => {
        newUserEmail = 'new-user@example.gov.uk'
        callingUserId = 123
        callingUserEmail = 'admin@example.govuk'

        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: ['manage_accounts']
          }
        })

        // set up so that the proposed user exists but is disabled
        idmConnector.usersClient.getUserByUsername
          .withArgs(newUserEmail, 'water_admin')
          .resolves({
            user_id: 456,
            user_name: newUserEmail,
            enabled: false
          })

        // a call to re-enable to user account resolves with the user
        idmConnector.usersClient.enableUser.resolves({
          user_id: 456,
          user_name: newUserEmail,
          enabled: false
        })

        // when setting the roles, the user in the response
        // contains the fully resolved roles and any groups.
        userRolesConnector.setInternalUserRoles.resolves({
          data: {
            user_id: 100,
            user_name: newUserEmail,
            reset_guid: '22222222-2222-2222-2222-222222222222',
            roles: [
              'returns',
              'bulk_return_notifications',
              'manage_accounts',
              'unlink_licences'
            ],
            groups: ['billing_and_data']
          }
        })

        event.save.resolves()
        emailNotifications.sendNewInternalUserMessage.resolves({})

        const request = {
          payload: {
            callingUserId,
            newUserEmail,
            permissionsKey: 'billing_and_data'
          }
        }
        await controller.postUserInternal(request, h)
      })

      test('does not create a new CRM entity', async () => {
        expect(
          crmEntitiesConnector.getOrCreateInternalUserEntity.called
        ).to.be.false()
      })

      test('the user is not created in the IDM', async () => {
        expect(
          idmConnector.usersClient.createUser.called
        ).to.be.false()
      })

      test('the user roles and groups are set', async () => {
        const [userId, roles, groups] = userRolesConnector.setInternalUserRoles.lastCall.args
        expect(userId).to.equal(userId)
        expect(roles).to.equal(getRolesForPermissionKey('billing_and_data').roles)
        expect(groups).to.equal(getRolesForPermissionKey('billing_and_data').groups)
      })

      test('an email is not sent to the existing user', async () => {
        expect(
          emailNotifications.sendNewInternalUserMessage.called
        ).to.be.false()
      })

      test('an event is created for audit purposes', async () => {
        const [savedEvent] = event.save.lastCall.args
        expect(savedEvent.type).to.equal('new-user')
        expect(savedEvent.subtype).to.equal('internal')
        expect(savedEvent.issuer).to.equal(callingUserEmail)
        expect(savedEvent.metadata.user).to.equal(newUserEmail)
      })

      test('the existing IDM user is returned in the response', async () => {
        const [body] = h.response.lastCall.args
        expect(body.user_id).to.equal(100)
        expect(body.user_name).to.equal(newUserEmail)
        expect(body.roles).to.equal([
          'returns',
          'bulk_return_notifications',
          'manage_accounts',
          'unlink_licences'
        ])

        expect(body.groups).to.equal(['billing_and_data'])
      })

      test('the response has a status code of 201 (created)', async () => {
        expect(statusCodeSpy.calledWith(201)).to.be.true()
      })
    })
  })

  experiment('.patchUserInternal', () => {
    let request

    let userId
    let userEmail
    let callingUserId
    let permissionsKey
    let callingUserEmail

    beforeEach(async () => {
      userId = 1
      callingUserId = 123
      callingUserEmail = 'admin@example.govuk'
      permissionsKey = 'nps_ar_user'
      userEmail = 'bob@gov.uk'
      request = {
        params: {
          userId
        },
        payload: {
          callingUserId,
          permissionsKey
        }
      }

      // when setting the roles, the user in the response
      // contains the fully resolved roles and any groups.
      userRolesConnector.setInternalUserRoles.resolves({
        data: {
          user_id: userId,
          user_name: userEmail,
          reset_guid: '22222222-2222-2222-2222-222222222222',
          roles: [
            'returns',
            'bulk_return_notifications',
            'manage_accounts',
            'unlink_licences'
          ],
          groups: ['billing_and_data']
        }
      })
    })

    experiment('when the calling user has permission to manage roles', () => {
      beforeEach(async () => {
        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.withArgs(callingUserId).resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: ['manage_accounts']
          }
        })

        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.withArgs(userId).resolves({
          data: {
            user_id: userId,
            user_name: userEmail,
            roles: []
          }
        })

        await controller.patchUserInternal(request)
      })

      test('calls the IDM to get the calling user', async () => {
        expect(idmConnector.usersClient.findOne.firstCall.calledWith(
          callingUserId
        )).to.be.true()
      })

      test('calls the IDM to get the user being updated', async () => {
        expect(idmConnector.usersClient.findOne.secondCall.calledWith(
          userId
        )).to.be.true()
      })

      test('calls the IDM to update the user roles/permissions', async () => {
        const [id, roles, groups] = userRolesConnector.setInternalUserRoles.lastCall.args
        expect(id).to.equal(userId)
        expect(roles).to.equal(['ar_user'])
        expect(groups).to.equal(['nps'])
      })

      test('writes an event for audit purposes', async () => {
        const [savedEvent] = event.save.lastCall.args
        expect(savedEvent.type).to.equal('update-user-roles')
        expect(savedEvent.subtype).to.equal('internal')
        expect(savedEvent.issuer).to.equal(callingUserEmail)
        expect(savedEvent.metadata.userId).to.equal(userId)
        expect(savedEvent.metadata.user).to.equal(userEmail)
      })
    })

    experiment('when the calling user does not have permission to manage roles', () => {
      beforeEach(async () => {
        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.withArgs(callingUserId).resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: []
          }
        })
      })

      test('a 403 forbidden error is returned', async () => {
        const err = await controller.patchUserInternal(request)
        expect(err.isBoom).to.be.true()
        expect(err.output.statusCode).to.equal(403)
      })
    })
  })

  experiment('.deleteUserInternal', () => {
    let request

    let userId
    let userEmail
    let callingUserId
    let callingUserEmail

    beforeEach(async () => {
      userId = 1
      callingUserId = 123
      callingUserEmail = 'admin@example.govuk'
      userEmail = 'bob@gov.uk'
      request = {
        params: {
          userId
        },
        payload: {
          callingUserId
        }
      }
    })

    experiment('when the calling user has permission to manage roles', () => {
      beforeEach(async () => {
        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.withArgs(callingUserId).resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: ['manage_accounts']
          }
        })

        idmConnector.usersClient.disableUser.resolves({
          user_id: userId,
          user_name: userEmail
        })

        await controller.deleteUserInternal(request)
      })

      test('calls the IDM to get the calling user', async () => {
        expect(idmConnector.usersClient.findOne.firstCall.calledWith(
          callingUserId
        )).to.be.true()
      })

      test('calls the IDM to disable the user account', async () => {
        expect(idmConnector.usersClient.disableUser.firstCall.calledWith(
          userId, config.idm.application.internalUser
        )).to.be.true()
      })

      test('writes an event for audit purposes', async () => {
        const [savedEvent] = event.save.lastCall.args
        expect(savedEvent.type).to.equal('delete-user')
        expect(savedEvent.subtype).to.equal('internal')
        expect(savedEvent.issuer).to.equal(callingUserEmail)
        expect(savedEvent.metadata.userId).to.equal(userId)
        expect(savedEvent.metadata.user).to.equal(userEmail)
      })
    })

    experiment('when the disable user call does not find a user', () => {
      beforeEach(async () => {
        idmConnector.usersClient.disableUser.resolves()

        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.withArgs(callingUserId).resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: ['manage_accounts']
          }
        })
      })

      test('a 404 not found error is returned', async () => {
        const err = await controller.deleteUserInternal(request)
        expect(err.isBoom).to.be.true()
        expect(err.output.statusCode).to.equal(404)
      })
    })

    experiment('when the calling user does not have permission to manage roles', () => {
      beforeEach(async () => {
        // set up to confirm the calling user has the correct role
        idmConnector.usersClient.findOne.withArgs(callingUserId).resolves({
          data: {
            user_id: callingUserId,
            user_name: callingUserEmail,
            roles: []
          }
        })
      })

      test('a 403 forbidden error is returned', async () => {
        const err = await controller.deleteUserInternal(request)
        expect(err.isBoom).to.be.true()
        expect(err.output.statusCode).to.equal(403)
      })
    })
  })
})
