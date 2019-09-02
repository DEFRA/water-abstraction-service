const { throwIfError } = require('@envage/hapi-pg-rest-api');
const documents = require('../../../lib/connectors/crm/documents');
const { getPagination } = require('./pagination');
const { returnsDateToIso } = require('../../../lib/dates');
const { getFullName } = require('../../../lib/licence-transformer/nald-helpers');

const validateRowMetadata = row => {
  if (!row.metadata) {
    const err = new Error('No metadata for document');
    err.params = {
      documentId: row.document_id,
      licenceRef: row.system_external_id
    };
    throw err;
  }
};

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
  validateRowMetadata(row);

  return {
    documentId: row.document_id,
    licenceNumber: row.system_external_id,
    licenceHolder: getLicenceHolderNameFromDocumentHeader(row),
    documentName: row.document_name,
    expires: returnsDateToIso(row.metadata.Expires),
    isCurrent: row.metadata.IsCurrent
  };
};

/**
 * Searches documents with given query string
 *
 * Unlike most other searches in the application, this search will also request
 * expired documents to allow the submission of older returns data.
 * @param  {String} query - the user's search query
 * @return {Promise}        resolves with licences
 */
const searchDocuments = async (query, page = 1) => {
  const filter = {
    string: query,
    includeExpired: true // include expired documents
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

exports.mapRow = mapRow;
exports.searchDocuments = searchDocuments;
