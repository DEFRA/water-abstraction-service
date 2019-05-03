const returnsConnector = require('../../lib/connectors/returns');
const documentsConnector = require('../../lib/connectors/crm/documents');

const documentsHelper = require('./lib/documents');
const returnsHelper = require('./lib/returns');

const rowMapper = ret => {
  return {
    licenceNumber: ret.licence_ref,
    returnId: ret.return_id,
    startDate: ret.start_date,
    endDate: ret.end_date,
    frequency: ret.returns_frequency,
    returnRequirement: ret.return_requirement,
    status: ret.status
  };
};

/**
 * Gets all returns for a company
 */
const getReturns = async (request, h) => {
  const { entityId } = request.params;

  // Get documents for the supplied company entity
  const documentsFilter = documentsHelper.createDocumentsFilter(entityId);
  const documents = await documentsConnector.findAll(documentsFilter);

  // Get returns matching the documents and other filter params supplied
  // in request GET params
  const returnsFilter = returnsHelper.createReturnsFilter(request, documents);
  const columms = [
    'return_id', 'licence_ref', 'start_date', 'end_date',
    'returns_frequency', 'return_requirement', 'status'
  ];
  const returns = await returnsConnector.returns.findAll(returnsFilter, null, columms);

  // Map returns
  return returns.map(rowMapper);
};

exports.getReturns = getReturns;
