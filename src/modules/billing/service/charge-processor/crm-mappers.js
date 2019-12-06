const { flatMap } = require('lodash');

const getRolesOfType = (doc, role) => doc.documentRoles.filter(docRole => docRole.roleName === role);

const getRoles = (docs, role) => flatMap(docs.map(doc => getRolesOfType(doc, role)));

const getBillingRoles = docs => getRoles(docs, 'billing');
const getLicenceHolderRoles = docs => getRoles(docs, 'licenceHolder');

exports.getBillingRoles = getBillingRoles;
exports.getLicenceHolderRoles = getLicenceHolderRoles;
