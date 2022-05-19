const { TEST_COMPANY_NAME, ACCEPTANCE_TEST_SOURCE } = require('./constants')
const documentV1Connector = require('../../../lib/connectors/crm/documents')
const documentV2Connector = require('../../../lib/connectors/crm-v2/documents')

const config = require('../../../../config')

const create = async (companyId, licenceId, licenceRef, companyV2Id, addressId) => {
  const document = {
    regime_entity_id: config.crm.waterRegime,
    system_id: 'permit-repo',
    system_internal_id: licenceId,
    system_external_id: licenceRef,
    company_entity_id: companyId,
    metadata: JSON.stringify({
      dataType: ACCEPTANCE_TEST_SOURCE,
      IsCurrent: true,
      Name: TEST_COMPANY_NAME,
      Town: 'AT Town',
      County: 'AT County',
      Country: 'AT Country',
      Expires: null,
      Forename: 'AT Forename',
      Initials: 'AT',
      Postcode: 'AT1 2AT',
      contacts: [
        {
          name: TEST_COMPANY_NAME,
          role: 'Licence holder',
          town: 'AT Town',
          type: 'Organisation',
          county: 'AT County',
          country: null,
          forename: null,
          initials: null,
          postcode: 'AT1 2AT',
          salutation: null
        }
      ]
    })
  }

  const { data } = await documentV1Connector.create(document)
  const documentV2 = await documentV2Connector.createDocument(licenceRef, 'current', '2019-01-01', null, true)

  const documentRole = {
    role: 'licenceHolder',
    startDate: '2019-01-01',
    endDate: null,
    invoiceAccountId: null,
    companyId: companyV2Id,
    contactId: null,
    isTest: true,
    addressId
  }

  documentV2Connector.createDocumentRole(documentV2.documentId, documentRole)

  return data
}

exports.create = create
exports.delete = async () => documentV1Connector.deleteAcceptanceTestData()
