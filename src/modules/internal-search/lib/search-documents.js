const { throwIfError } = require('@envage/hapi-pg-rest-api');
const documents = require('../../../lib/connectors/crm/documents');
const { getPagination } = require('./pagination');
const { returnsDateToIso } = require('../../import/lib/date-helpers');
const { getFullName } = require('../../../lib/licence-transformer/nald-helpers');

/**
 * Gets full name for a licence
 * @param  {[type]} documentHeader [description]
 * @return {[type]}                [description]
 */
const getLicenceHolderNameFromDocumentHeader = (documentHeader) => {
  const {
    Name: lastName,
    Forename: firstName,
    Initials: initials,
    Salutation: salutation
  } = documentHeader.metadata;
  return getFullName(salutation, initials, firstName, lastName);
};

const mapRow = (row) => {
  return {
    documentId: row.document_id,
    licenceNumber: row.system_external_id,
    licenceHolder: getLicenceHolderNameFromDocumentHeader(row),
    documentName: row.document_name,
    expires: returnsDateToIso(row.metadata.Expires)
  };
};

/**
 * Searches documents with given query string
 * @param  {String} query - the user's search query
 * @return {Promise}        resolves with licences
 */
const searchDocuments = async (query, page = 1) => {
  const filter = {
    string: query
  };

  const columns = [
    'document_id',
    'system_external_id',
    'metadata',
    'document_name'
  ];

  const sort = {
    system_external_id: 1
  };

  const response = await documents.findMany(filter, sort, getPagination(page), columns);
  throwIfError(response.error);

  const { pagination } = response;
  return {
    pagination,
    data: response.data.map(mapRow)
  };
};

module.exports = {
  mapRow,
  searchDocuments
};
