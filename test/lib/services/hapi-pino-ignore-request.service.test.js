'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it } = exports.lab = Lab.script()
const { expect } = Code

// Thing under test
const HapiPinoIgnoreRequestService = require('../../../src/lib/services/hapi-pino-ignore-request.service.js')

describe('Hapi Pino Ignore Request service', () => {
  const _options = {}

  describe("when the request is for '/status'", () => {
    it('returns true', () => {
      const result = HapiPinoIgnoreRequestService.go(_options, { path: '/status' })

      expect(result).to.be.true()
    })
  })

  describe("when the request is for '/favicon.ico'", () => {
    it('returns true', () => {
      const result = HapiPinoIgnoreRequestService.go(_options, { path: '/favicon.ico' })

      expect(result).to.be.true()
    })
  })

  describe("when the request is not for '/status'", () => {
    it('returns false', () => {
      const result = HapiPinoIgnoreRequestService.go(_options, { path: '/bill-run/stuff' })

      expect(result).to.be.false()
    })
  })
})
