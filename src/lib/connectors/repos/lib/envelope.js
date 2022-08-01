const { pick } = require('lodash')

const mapBookshelfPagination = pagination => ({
  ...pick(pagination, ['page', 'pageCount']),
  perPage: pagination.pageSize,
  totalRows: pagination.rowCount
})

const paginatedEnvelope = bookshelfResult => ({
  data: bookshelfResult.toJSON(),
  pagination: mapBookshelfPagination(bookshelfResult.pagination)
})

exports.paginatedEnvelope = paginatedEnvelope
