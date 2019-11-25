const models = require('../models');
const repositories = require('../../../lib/connectors/repository');
const crm = require('../../../lib/connectors/crm-v2');
const helpers = require('@envage/water-abstraction-helpers');
const { flatMap } = require('lodash');

const getData = async chargeVersionId => {
  // Load charge version
  const [chargeVersion, chargeElements] = await Promise.all([
    repositories.chargeVersions.findOneById(chargeVersionId),
    repositories.chargeElements.findByChargeVersionId(chargeVersionId)
  ]);

  // @TODO Load licence agreements

  // Load CRM docs
  const docs = await crm.documents.getDocuments(chargeVersion.licence_ref);
  const tasks = docs.map(doc => crm.documents.getDocument(doc.documentId));

  return {
    chargeVersion,
    chargeElements,
    docs: await Promise.all(tasks)
  };
};

const getRoles = (doc, roleName) =>
  doc.documentRoles.filter(role => role.roleName === roleName);

const getDocumentHistory = (docs, roleName) => {
  const roles = docs.map(doc => getRoles(doc, roleName));
  return helpers.charging.mergeHistory(flatMap(roles));
};

// To-do:
// Load charge version
// Load licence docs versions from API
// Loop through and create invoices
const initialiseFromChargeVersionYear = async chargeVersionYear => {
  // Initialise batch
  const batch = new models.Batch();
  batch.id = chargeVersionYear.billing_batch_id;

  // Initialise financial year
  const financialYear = new models.FinancialYear(chargeVersionYear.financial_year_ending);

  // Load raw data
  const data = await getData(chargeVersionYear.charge_version_id);

  const licenceHolders = getDocumentHistory(data.docs, 'licenceHolder');
  // const billing = getDocumentHistory(data.docs, 'billing');

  console.log(licenceHolders);

  // @TODO merge/split LH/billing

  // console.log(licenceHolders);
  // console.log(invoiceAccounts);
  // // console.log(JSON.stringify(data, null, 2));
  // // console.log(batch);
  // // console.log(financialYear);

  // // console.log(getLicenceHolderHistory(data.docs));
};

initialiseFromChargeVersionYear({
  billing_batch_charge_version_year_id: '944dc076-a034-4845-991e-28f64fe1f8c4',
  billing_batch_id: '7b844a49-b11e-431c-910a-c188995c989d',
  charge_version_id: '7356111a-4c18-4316-9d10-8a239ee987a3',
  financial_year_ending: 2018,
  status: 'processing'
});
