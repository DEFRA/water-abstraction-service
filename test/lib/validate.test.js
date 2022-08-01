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

const { validate } = require('../../src/lib/validate')
const idmConnector = require('../../src/lib/connectors/idm')
const User = require('../../src/lib/models/user')

const id = 12345
const email = 'mail@example.com'
const roles = ['scope_1', 'scope_2']

experiment('lib/validate', () => {
  beforeEach(async () => {
    sandbox.stub(idmConnector.usersClient, 'findOneById').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.validate', () => {
    let request, result

    beforeEach(async () => {
      request = {}
    })

    test('does not validate when there is no id in the decoded token', async () => {
      const decoded = { email, roles }
      expect(await validate(decoded, request)).to.equal({
        isValid: false
      })
    })

    experiment('when there is no defra-internal-user-id header', () => {
      beforeEach(async () => {
        const decoded = { id, email, roles }
        result = await validate(decoded, request)
      })

      test('the IDM service is not called', async () => {
        expect(idmConnector.usersClient.findOneById.called).to.be.false()
      })

      test('the decoded credentials are returned directly', async () => {
        expect(result).to.equal({
          isValid: true,
          credentials: {
            id,
            email,
            scope: roles
          }
        })
      })
    })

    experiment('when there is a defra-internal-user-id header', () => {
      beforeEach(async () => {
        request.headers = {
          'defra-internal-user-id': id
        }
      })

      experiment('when an email address is present in the decoded credentials', () => {
        beforeEach(async () => {
          const decoded = { email, id, roles }
          result = await validate(decoded, request)
        })

        test('the IDM service is not called', async () => {
          expect(idmConnector.usersClient.findOneById.called).to.be.false()
        })

        test('the decoded credentials are returned directly', async () => {
          expect(result).to.equal({
            isValid: true,
            credentials: {
              id,
              email,
              scope: roles
            }
          })
        })
      })

      experiment('when an email address is not present in the decoded credentials', () => {
        let decoded

        beforeEach(async () => {
          decoded = { id: 'test-id', roles: [] }
        })

        experiment('when the user is not found', () => {
          beforeEach(async () => {
            result = await validate(decoded, request)
          })

          test('the IDM service is called', async () => {
            expect(idmConnector.usersClient.findOneById.calledWith(
              id
            )).to.be.true()
          })

          test('an error message is returned', async () => {
            expect(result).to.equal({
              isValid: false,
              errorMessage: `User ${id} not found`
            })
          })

          test('the user is not added to the request', async () => {
            expect(request.defra).to.be.undefined()
          })
        })

        experiment('when the user is not internal', () => {
          beforeEach(async () => {
            idmConnector.usersClient.findOneById.resolves({
              application: 'not_internal'
            })
            result = await validate(decoded, request)
          })

          test('the IDM service is called', async () => {
            expect(idmConnector.usersClient.findOneById.calledWith(
              id
            )).to.be.true()
          })

          test('an error message is returned', async () => {
            expect(result).to.equal({
              isValid: false,
              errorMessage: `User ${id} not internal`
            })
          })

          test('the user is not added to the request', async () => {
            expect(request.defra).to.be.undefined()
          })
        })

        experiment('when the user is internal', () => {
          beforeEach(async () => {
            idmConnector.usersClient.findOneById.resolves({
              user_id: id,
              user_name: email,
              roles,
              application: 'water_admin'
            })
            result = await validate(decoded, request)
          })

          test('the IDM service is called', async () => {
            expect(idmConnector.usersClient.findOneById.calledWith(
              id
            )).to.be.true()
          })

          test('the expected credentials are returned', async () => {
            expect(result).to.equal({
              isValid: true,
              credentials: {
                id,
                email,
                scope: roles
              }
            })
          })

          test('the user is added to the request', async () => {
            expect(request.defra.internalCallingUser).to.equal({
              id,
              email
            })
            expect(request.defra.internalCallingUserModel instanceof User).to.be.true()
            expect(request.defra.internalCallingUserModel.id).to.equal(id)
            expect(request.defra.internalCallingUserModel.email).to.equal(email)
          })
        })
      })
    })
  })
})
