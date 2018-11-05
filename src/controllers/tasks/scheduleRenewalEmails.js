// const Notify = require('../notify');
const messageQueue = require('../../lib/message-queue');
const { enqueue } = require('../../modules/notify')(messageQueue);

const crm = {
  documents: require('../../lib/connectors/crm/documents')
};
const Permit = require('../../lib/connectors/permit');
// const moment = require('moment');

async function run (data) {
  // send request to CRM to select licences with expiry in the next N days

  // http://127.0.0.1:8004/crm/1.0/expiring_licences?filter={"licence_type_id":8,"licence_regime_id":1}

  const expiring = await Permit.expiringLicences.findMany();

  // 18/54/08/0538
  expiring.data.forEach(async (licence) => {
    const responsedata = await crm.documents.getDocumentRoles({
      role: 'primary_user',
      system_external_id: licence.licence_ref
    });

    if (responsedata.data[0] && responsedata.data[0].individual_nm) {
      const recipient = responsedata.data[0].individual_nm;

      try {
        // Read CRM doc header to get document custom name
        const { data, error } = await crm.documents.getDocument(responsedata.data[0].document_id);

        if (error) {
          throw error;
        }

        const config = {
          id: `${licence.licence_ref}_${licence.licence_end_dt}_${recipient}`,
          recipient,
          messageRef: 'expiry_notification_email',
          personalisation: {
            licence_no: licence.licence_ref,
            licence_name: data.document_name || ''
          },
          individualEntityId: responsedata.data[0].individual_entity_id,
          companyEntityId: responsedata.data[0].company_entity_id,
          licences: [licence.licence_ref]
        };

        await enqueue(config);
      } catch (error) {
        return { error };
      }
    }
  });

  // get contact details for those licences

  // check if notification has been sent

  // schedule notifications
  return {
    error: null
  };
}

module.exports = {
  run
};
