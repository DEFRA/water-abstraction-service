'use strict'

const { expect } = require('@hapi/code')
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script()

const controller = require('../../../../src/modules/licences/controllers/licences')
const licencesService = require('../../../../src/lib/services/licences')
const documentsService = require('../../../../src/lib/services/documents-service')

// Models
const Licence = require('../../../../src/lib/models/licence')
const InvoiceAccount = require('../../../../src/lib/models/invoice-account')

const crmDocumentsConnector = require('../../../../src/lib/connectors/crm/documents')

const sandbox = require('sinon').createSandbox()

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(licencesService, 'getLicenceById')
    sandbox.stub(licencesService, 'getLicenceByLicenceRef')
    sandbox.stub(licencesService, 'getLicenceVersions')
    sandbox.stub(licencesService, 'getLicenceAccountsByRefAndDate')
    sandbox.stub(licencesService, 'getReturnsByLicenceId')
    sandbox.stub(licencesService, 'getScheduledNotificationsByLicenceId')

    sandbox.stub(documentsService, 'getValidDocumentOnDate')

    sandbox.stub(crmDocumentsConnector, 'getDocumentsByLicenceNumbers')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getLicence', () => {
    let request, result

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-id'
        }
      }
    })

    experiment('when the licence exists', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves(new Licence())
        result = await controller.getLicence(request)
      })

      test('the licence ID is passed to the service', async () => {
        expect(licencesService.getLicenceById.calledWith('test-id')).to.be.true()
      })

      test('resolves with a licence model', async () => {
        expect(result instanceof Licence).to.be.true()
      })
    })

    experiment('when the licence does not exist', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves(null)
        result = await controller.getLicence(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })
  })

  experiment('.getLicenceVersions', () => {
    let result
    let request
    let licenceVersions

    beforeEach(async () => {
      licenceVersions = [
        { licenceVersionId: '1' },
        { licenceVersionId: '2' }
      ]

      licencesService.getLicenceVersions.resolves(licenceVersions)

      request = {
        params: {
          licenceId: 'test-licence-id'
        }
      }

      result = await controller.getLicenceVersions(request)
    })

    test('passes the licence id to the service layer', async () => {
      const [id] = licencesService.getLicenceVersions.lastCall.args
      expect(id).to.equal(request.params.licenceId)
    })

    test('returns the licence versions', async () => {
      expect(result).to.equal(licenceVersions)
    })
  })

  experiment('.getLicenceAccountsByRefAndDate', () => {
    let result
    let request
    let exampleLicenceAccount

    beforeEach(async () => {
      exampleLicenceAccount = new InvoiceAccount()

      licencesService.getLicenceAccountsByRefAndDate.resolves([exampleLicenceAccount])

      request = {
        query: {
          documentRef: 'test-doc-id',
          date: '2020-10-10'
        }
      }

      result = await controller.getLicenceAccountsByRefAndDate(request)
    })

    test('passes the document ref to the service layer', async () => {
      const [documentRef] = licencesService.getLicenceAccountsByRefAndDate.lastCall.args
      expect(documentRef).to.equal(request.query.documentRef)
    })

    test('returns an array', async () => {
      expect(result).to.equal([exampleLicenceAccount])
    })
  })

  experiment('.getLicenceDocument', () => {
    let result, request

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        },
        query: {}
      }
    })

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves(null)
        result = await controller.getLicenceDocument(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        const licence = new Licence().fromHash({ licenceNumber: '01/123/ABC' })
        licencesService.getLicenceById.resolves(licence)
      })

      experiment('when the CRM document is not found', () => {
        beforeEach(async () => {
          crmDocumentsConnector.getDocumentsByLicenceNumbers.resolves([])
          result = await controller.getLicenceDocument(request)
        })

        test('resolves with a Boom 404', async () => {
          expect(result.isBoom).to.be.true()
          expect(result.output.statusCode).to.equal(404)
        })
      })

      experiment('when the CRM document is found', () => {
        beforeEach(async () => {
          crmDocumentsConnector.getDocumentsByLicenceNumbers.resolves([{
            document_id: 'test-document-id'
          }])
          result = await controller.getLicenceDocument(request)
        })

        test('resolves with the document', async () => {
          expect(result.document_id).to.equal('test-document-id')
        })
      })
    })
  })

  experiment('.getValidLicenceDocumentByDate', () => {
    let result, request

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        }
      }
    })

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        licencesService.getLicenceById.resolves(null)
        result = await controller.getValidLicenceDocumentByDate(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        const licence = new Licence().fromHash({ licenceNumber: '01/123/ABC' })
        licencesService.getLicenceById.resolves(licence)
      })

      beforeEach(async () => {
        documentsService.getValidDocumentOnDate.resolves({
          document_id: 'test-document-id'
        })
        result = await controller.getValidLicenceDocumentByDate(request)
      })

      test('resolves with the document', async () => {
        expect(result.document_id).to.equal('test-document-id')
      })
    })
  })

  experiment('.getLicenceReturns', () => {
    let result, request

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        },
        query: {
          page: 1,
          perPage: 50
        }
      }
    })

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        licencesService.getReturnsByLicenceId.resolves(null)
        result = await controller.getLicenceReturns(request)
      })

      test('calls the expected service method', async () => {
        expect(licencesService.getReturnsByLicenceId.calledWith(
          request.params.licenceId,
          request.query.page,
          request.query.perPage
        ))
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the licence is not found', () => {
      const serviceResponse = { pagination: {}, data: [] }

      beforeEach(async () => {
        licencesService.getReturnsByLicenceId.resolves(serviceResponse)
        result = await controller.getLicenceReturns(request)
      })

      test('calls the expected service method', async () => {
        expect(licencesService.getReturnsByLicenceId.calledWith(
          request.params.licenceId,
          request.query.page,
          request.query.perPage
        ))
      })

      test('resolves with the service method response', async () => {
        expect(result).to.equal(serviceResponse)
      })
    })
  })

  experiment('.getLicenceNotifications', () => {
    let result, request

    beforeEach(async () => {
      request = {
        params: {
          licenceId: 'test-licence-id'
        },
        query: {
          page: 1,
          perPage: 50
        }
      }
    })

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        licencesService.getScheduledNotificationsByLicenceId.resolves(null)
        result = await controller.getLicenceNotifications(request)
      })

      test('calls the expected service method', async () => {
        expect(licencesService.getScheduledNotificationsByLicenceId.calledWith(
          request.params.licenceId,
          request.query.page,
          request.query.perPage
        ))
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the licence is not found', () => {
      const serviceResponse = { pagination: {}, data: [] }

      beforeEach(async () => {
        licencesService.getScheduledNotificationsByLicenceId.resolves(serviceResponse)
        result = await controller.getLicenceNotifications(request)
      })

      test('calls the expected service method', async () => {
        expect(licencesService.getScheduledNotificationsByLicenceId.calledWith(
          request.params.licenceId,
          request.query.page,
          request.query.perPage
        ))
      })

      test('resolves with the service method response', async () => {
        expect(result).to.equal(serviceResponse)
      })
    })
  })

  experiment('.getLicenceByLicenceNumber', () => {
    let request, result

    const licenceNumber = '01/123/ABC'

    beforeEach(async () => {
      request = {
        query: {
          licenceNumber
        }
      }
    })

    experiment('when the licence exists', () => {
      beforeEach(async () => {
        licencesService.getLicenceByLicenceRef.resolves(new Licence())
        result = await controller.getLicenceByLicenceNumber(request)
      })

      test('the licence number is passed to the service', async () => {
        expect(licencesService.getLicenceByLicenceRef.calledWith(licenceNumber)).to.be.true()
      })

      test('resolves with a licence model', async () => {
        expect(result instanceof Licence).to.be.true()
      })
    })

    experiment('when the licence does not exist', () => {
      beforeEach(async () => {
        licencesService.getLicenceByLicenceRef.resolves(null)
        result = await controller.getLicenceByLicenceNumber(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })
  })
})
