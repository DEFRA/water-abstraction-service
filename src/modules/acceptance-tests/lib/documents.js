const { TEST_COMPANY_NAME, ACCEPTANCE_TEST_SOURCE } = require('./constants');
const documentConnector = require('../../../lib/connectors/crm/documents');
const config = require('../../../../config');
const db = require('../../../lib/connectors/db');

const create = async (companyId, licenceId, licenceRef) => {
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
  };

  const { data } = await documentConnector.create(document);
  return data;
};

const deleteDocuments = () => {
  return db.query(`
    delete from
    crm.document_header
    where metadata->>'dataType' = '${ACCEPTANCE_TEST_SOURCE}';`);
};

const deleteAll = () => Promise.all([
  deleteDocuments()
]);

exports.create = create;
exports.delete = deleteAll;
