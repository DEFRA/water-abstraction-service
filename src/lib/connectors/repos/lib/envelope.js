const { pick } = require('lodash');

const mapBookshelfPagination = pagination => ({
  ...pick(pagination, ['page', 'pageCount']),
  perPage: pagination.pageSize,
  totalRows: pagination.rowCount
});

const paginatedEnvelope = bookshelfResult => ({
  data: bookshelfResult.toJSON(),
  pagination: mapBookshelfPagination(bookshelfResult.pagination)
});

const paginateRawQueryResults = (results, page, perPage) => {
  const totalRows = results.length;
  const pagination = {
    page,
    perPage,
    totalRows,
    pageCount: Math.ceil(totalRows / perPage)
  };

  const startIndex = (page - 1) * perPage;
  const endIndex = page * perPage;

  return {
    data: results.slice(startIndex, endIndex),
    pagination
  };
};

exports.paginatedEnvelope = paginatedEnvelope;
exports.paginateRawQueryResults = paginateRawQueryResults;
