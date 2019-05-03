
const createReturnsFilter = (request, documents) => {
  const filter = {
    'metadata->>isCurrent': 'true',
    licence_ref: {
      $in: documents.map(row => row.system_external_id)
    }
  };

  if ('startDate' in request.query) {
    filter.start_date = {
      $gte: request.query.startDate
    };
  };

  if ('endDate' in request.query) {
    filter.end_date = {
      $lte: request.query.endDate
    };
  };

  if ('summer' in request.query) {
    filter['metadata->>isSummer'] = request.query.isSummer ? 'true' : 'false';
  }

  if ('status' in request.query) {
    filter.status = request.query.status;
  }
  return filter;
};

exports.createReturnsFilter = createReturnsFilter;
