'use strict'

const { expect } = require('@hapi/code')
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script()
const { v4: uuid } = require('uuid')

const controller = require('../../../../src/modules/licences/controllers/agreements')
const eventsService = require('../../../../src/lib/services/events')
const licenceAgreementsService = require('../../../../src/lib/services/licence-agreements')

const User = require('../../../../src/lib/models/user')
const Licence = require('../../../../src/lib/models/licence')
const LicenceAgreement = require('../../../../src/lib/models/licence-agreement')

const { NotFoundError } = require('../../../../src/lib/errors')

const sandbox = require('sinon').createSandbox()

const responseStub = {
  code: sandbox.stub()
}

const h = {
  response: sandbox.stub().returns(responseStub)
}

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(licenceAgreementsService, 'getLicenceAgreementById')
    sandbox.stub(licenceAgreementsService, 'getLicenceAgreementsByLicenceRef')
    sandbox.stub(licenceAgreementsService, 'patchLicenceAgreement')
    sandbox.stub(licenceAgreementsService, 'deleteLicenceAgreementById')
    sandbox.stub(licenceAgreementsService, 'createLicenceAgreement')

    sandbox.stub(eventsService, 'create')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getAgreement', () => {
    let request
    let result
    let agreementId

    beforeEach(async () => {
      agreementId = uuid()
      request = {
        params: {
          agreementId
        }
      }
    })

    experiment('when the agreement exists', () => {
      beforeEach(async () => {
        licenceAgreementsService.getLicenceAgreementById.resolves({ agreementId })
        result = await controller.getAgreement(request)
      })

      test('the agreement ID is passed to the service', async () => {
        expect(licenceAgreementsService.getLicenceAgreementById.calledWith(agreementId)).to.be.true()
      })

      test('resolves with the expected data', async () => {
        expect(result.agreementId).to.equal(agreementId)
      })
    })

    experiment('when the licence does not exist', () => {
      beforeEach(async () => {
        licenceAgreementsService.getLicenceAgreementById.resolves(null)
        result = await controller.getAgreement(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })
  })

  experiment('.getLicenceAgreements', () => {
    let request
    let result

    experiment('when there is a licence for the id', () => {
      let licenceAgreementId

      beforeEach(async () => {
        request = {
          params: {
            licenceId: uuid()
          },
          pre: {
            licence: {
              licenceNumber: '123/123'
            }
          }
        }

        licenceAgreementsService.getLicenceAgreementsByLicenceRef.resolves([
          { licenceAgreementId: licenceAgreementId = uuid() }
        ])

        result = await controller.getLicenceAgreements(request)
      })

      test('the agreements are returned', async () => {
        expect(result).equal([
          { licenceAgreementId }
        ])
      })
    })
  })

  experiment('.patchAgreement', () => {
    let request
    beforeEach(async () => {
      request = {
        params: {
          agreementId: uuid()
        },
        payload: {
          endDate: '2030-10-10'
        },
        pre: {
          licence: {
            licenceNumber: '123/123'
          }
        },
        defra: {
          internalCallingUserModel: new User(123, 'mail@example.com')
        }
      }
    })
    experiment('when the request is valid', () => {
      beforeEach(async () => {
        licenceAgreementsService.patchLicenceAgreement.resolves()
        await controller.patchAgreement(request, h)
      })
      test('calls the service method', async () => {
        expect(licenceAgreementsService.patchLicenceAgreement.called).to.be.true()
      })
    })
  })

  experiment('.deleteAgreement', () => {
    let request, agreementId
    beforeEach(() => {
      agreementId = uuid()
      request = {
        params: {
          agreementId
        },
        defra: {
          internalCallingUser: {
            email: 'test@example.com'
          },
          internalCallingUserModel: new User(123, 'mail@example.com')
        }
      }
    })

    experiment('when the agreement is not found', () => {
      let result
      beforeEach(async () => {
        licenceAgreementsService.deleteLicenceAgreementById.rejects(new NotFoundError('Not found'))
        result = await controller.deleteAgreement(request, h)
      })

      test('calls the service method with the correct id and issuer', async () => {
        expect(licenceAgreementsService.deleteLicenceAgreementById.calledWith(
          request.params.agreementId,
          request.defra.internalCallingUserModel
        ))
      })

      test('returns a Boom 404 error', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the agreement is deleted successfully', () => {
      beforeEach(async () => {
        await controller.deleteAgreement(request, h)
      })

      test('calls the service method with the correct id', async () => {
        expect(licenceAgreementsService.deleteLicenceAgreementById.calledWith(
          request.params.agreementId,
          request.defra.internalCallingUserModel
        ))
      })

      test('responds with a 204', async () => {
        expect(responseStub.code.calledWith(204)).to.be.true()
      })
    })
  })

  experiment('.postLicenceAgreement', () => {
    let request, agreementId, result

    beforeEach(() => {
      agreementId = uuid()
      request = {
        params: {
          agreementId
        },
        payload: {
          code: 'S127',
          startDate: '2019-04-01',
          dateSigned: '2019-05-04'
        },
        defra: {
          internalCallingUser: {
            email: 'test@example.com'
          },
          internalCallingUserModel: new User(123, 'mail@example.com')
        },
        pre: {
          licence: new Licence(uuid())
        }
      }
    })

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        licenceAgreementsService.createLicenceAgreement.resolves(
          new LicenceAgreement(uuid())
        )
        result = await controller.postLicenceAgreement(request, h)
      })

      test('calls the service method with the correct parameters', async () => {
        const [licence, data, issuer] = licenceAgreementsService.createLicenceAgreement.lastCall.args
        expect(licence).to.equal(request.pre.licence)
        expect(data.code).to.equal(request.payload.code)
        expect(data.startDate).to.equal(request.payload.startDate)
        expect(data.dateSigned).to.equal(request.payload.dateSigned)
        expect(issuer).to.equal(request.defra.internalCallingUserModel)
      })

      test('responds with the new licence agreement model', async () => {
        expect(h.response.lastCall.args[0]).to.be.an.instanceof(LicenceAgreement)
      })

      test('uses a 201 http code', async () => {
        expect(responseStub.code.calledWith(201)).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      beforeEach(async () => {
        licenceAgreementsService.createLicenceAgreement.rejects(new NotFoundError())
        result = await controller.postLicenceAgreement(request, h)
      })

      test('the error is mapped to a suitable Boom error', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })
  })
})
