const Lab = require('@hapi/lab')
const { experiment, test, beforeEach } = exports.lab = Lab.script()
const { expect } = require('@hapi/code')

const { getPagination } = require('../../../../src/modules/internal-search/lib/pagination')

experiment('getPagination - formats pagination object for API calls', () => {
  let pagination
  beforeEach(async () => {
    pagination = getPagination()
  })

  test('It should show 50 results per page', async () => {
    expect(pagination.perPage).to.equal(50)
  })
  test('It should default to page 1', async () => {
    expect(pagination.page).to.equal(1)
  })
  test('It should set the page', async () => {
    pagination = getPagination(2)
    expect(pagination.page).to.equal(2)
  })
})
