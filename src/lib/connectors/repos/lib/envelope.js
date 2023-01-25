'use strict'

const mapBookshelfPagination = (pagination) => {
  const pageDetails = { page: pagination.page }
  if (pagination.pageCount) {
    pageDetails.pageCount = pagination.pageCount
  }

  return {
    ...pageDetails,
    perPage: pagination.pageSize,
    totalRows: pagination.rowCount
  }
}

const paginatedEnvelope = bookshelfResult => ({
  data: bookshelfResult.toJSON(),
  pagination: mapBookshelfPagination(bookshelfResult.pagination)
})

exports.paginatedEnvelope = paginatedEnvelope
