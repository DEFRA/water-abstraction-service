/**
 * Gets pagination config object
 * @param  {Number} [page=1] - the page of results
 * @return {Object}          pagination object
 */
const getPagination = (page = 1) => {
  return {
    page,
    perPage: 50
  }
}

module.exports = {
  getPagination
}
