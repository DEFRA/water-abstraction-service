/**
 * Creates a filter object to request returns from the returns service
 * @param  {Object} request   - the HAPI request
 * @param  {Array} documents  - a list of CRM document headers
 * @return {Object}           - filter object for returns API request
 */
const createReturnsFilter = (request, documents) => {
  const { query } = request;

  const filters = {
    startDate: { start_date: { $gte: query.startDate } },
    endDate: { end_date: { $lte: query.endDate } },
    isSummer: { 'metadata->>isSummer': query.isSummer ? 'true' : 'false' },
    status: { status: query.status }
  };

  const baseFilter = {
    'metadata->>isCurrent': 'true',
    licence_ref: {
      $in: documents.map(row => row.system_external_id)
    }
  };

  return Object.keys(request.query).reduce((acc, key) => {
    return Object.assign(acc, filters[key]);
  }, baseFilter);
};

exports.createReturnsFilter = createReturnsFilter;
