const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const documentConnector = require('../../../../src/lib/connectors/crm/documents')
const documentV2Connector = require('../../../../src/lib/connectors/crm-v2/documents')
const documents = require('../../../../src/modules/acceptance-tests/lib/documents')

experiment('modules/acceptance-tests/lib/documents', () => {
  beforeEach(async () => {
    sandbox.stub(documentConnector, 'create').callsFake(document => {
      return Promise.resolve({ data: document })
    })

    sandbox.stub(documentV2Connector, 'createDocument').resolves({})
    sandbox.stub(documentV2Connector, 'createDocumentRole').resolves({})

    sandbox.stub(documentConnector, 'deleteAcceptanceTestData').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('create', () => {
    let createdDocument

    beforeEach(async () => {
      createdDocument = await documents.create('comp-id', 'lic-id', 'lic-ref', 'company-V2-id', 'address-id')
    })

    test('sets the system_internal_id', async () => {
      expect(createdDocument.system_internal_id).to.equal('lic-id')
    })

    test('sets the system_external_id', async () => {
      expect(createdDocument.system_external_id).to.equal('lic-ref')
    })

    test('sets the company_entity_id', async () => {
      expect(createdDocument.company_entity_id).to.equal('comp-id')
    })
  })

  experiment('.delete', () => {
    test('calls the expected function on the connector', async () => {
      await documents.delete()
      expect(documentConnector.deleteAcceptanceTestData.called).to.be.true()
    })
  })
})
