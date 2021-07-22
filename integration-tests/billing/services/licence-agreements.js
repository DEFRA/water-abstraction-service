
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const queries = require('./queries/licence-agreements');

const tearDownTestLicenceAgreements = () =>
  bookshelf.knex('water.licence_agreements')
    .where('is_test', true)
    .del();

const tearDownCypressCreatedLicenceAgreements = () => bookshelf.knex.raw(queries.deleteLicenceAgreements);

exports.tearDownTestLicenceAgreements = tearDownTestLicenceAgreements;
exports.tearDownCypressCreatedLicenceAgreements = tearDownCypressCreatedLicenceAgreements
