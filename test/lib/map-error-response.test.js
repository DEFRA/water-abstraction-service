const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const mapErrorResponse = require('../../src/lib/map-error-response')
const { NotFoundError, InvalidEntityError, ConflictingDataError } = require('../../src/lib/errors')
const { BatchStatusError, TransactionStatusError } = require('../../src/modules/billing/lib/errors')

experiment('lib/map-error-response', () => {
  test('returns Boom not found for NotFoundError', () => {
    const response = mapErrorResponse(new NotFoundError('uh oh!'))
    expect(response.isBoom).to.be.true()
    expect(response.output.payload.statusCode).to.equal(404)
    expect(response.output.payload.error).to.equal('Not Found')
    expect(response.message).to.equal('uh oh!')
  })

  test('returns Boom not found for generic 404 error', () => {
    const error = new Error('uh oh!')
    error.statusCode = 404
    const response = mapErrorResponse(error)
    expect(response.isBoom).to.be.true()
    expect(response.output.payload.statusCode).to.equal(404)
    expect(response.output.payload.error).to.equal('Not Found')
    expect(response.message).to.equal('uh oh!')
  })

  test('returns Boom forbidden for BatchStatusError', () => {
    const response = mapErrorResponse(new BatchStatusError('uh oh!'))
    expect(response.isBoom).to.be.true()
    expect(response.output.payload.statusCode).to.equal(403)
    expect(response.output.payload.error).to.equal('Forbidden')
    expect(response.message).to.equal('uh oh!')
  })

  test('returns Boom forbidden for TransactionStatusError', () => {
    const response = mapErrorResponse(new TransactionStatusError('uh oh!'))
    expect(response.isBoom).to.be.true()
    expect(response.output.payload.statusCode).to.equal(403)
    expect(response.output.payload.error).to.equal('Forbidden')
    expect(response.message).to.equal('uh oh!')
  })

  test('returns Boom bad data for InvalidEntityError', () => {
    const response = mapErrorResponse(new InvalidEntityError('uh oh!'))
    expect(response.isBoom).to.be.true()
    expect(response.output.payload.statusCode).to.equal(422)
    expect(response.output.payload.error).to.equal('Unprocessable Entity')
    expect(response.message).to.equal('uh oh!')
  })

  test('returns Boom conflict for ConflictingDataError', () => {
    const response = mapErrorResponse(new ConflictingDataError('uh oh!'))
    expect(response.isBoom).to.be.true()
    expect(response.output.payload.statusCode).to.equal(409)
    expect(response.output.payload.error).to.equal('Conflict')
    expect(response.message).to.equal('uh oh!')
  })

  test('throws the error if unexpected', () => {
    const err = new Error('uh oh!')
    try {
      mapErrorResponse(err)
    } catch (err) {
      expect(err).to.equal(err)
    }
  })
})
