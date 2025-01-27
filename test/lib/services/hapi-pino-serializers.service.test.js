'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')

const { describe, it, beforeEach } = (exports.lab = Lab.script())
const { expect } = Code

// Thing under test
const HapiPinoSerializersService = require('../../../src/lib/services/hapi-pino-serializers.service.js')

describe('Hapi Pino Serializers service', () => {
  describe('when called', () => {
    it('returns an object containing two functions called "req" and "res"', () => {
      const result = HapiPinoSerializersService.go()

      expect(result.req).to.exist()
      expect(result.res).to.exist()
    })

    describe('and the function "res" when provided with a pino serialized request object', () => {
      let requestObject

      beforeEach(() => {
        requestObject = {
          id: '1737736750350:9bc56d13c48b:618:m6azkwqb:10004',
          method: 'get',
          url: '/bill-runs',
          query: {},
          headers: {
            connection: 'keep-alive',
            'cache-control': 'max-age=0',
            'sec-ch-ua': '"Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': 'macOS',
            'upgrade-insecure-requests': '1',
            'user-agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
            accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'sec-fetch-site': 'same-origin',
            'sec-fetch-mode': 'navigate',
            'sec-fetch-user': '?1',
            'sec-fetch-dest': 'document',
            referer: 'http://localhost:8008/system/bill-runs/a13ad1c9-331d-4ceb-9b61-cbd411a79e7b/cancel',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'en-GB,en;q=0.9,en-US;q=0.8',
            cookie: 'imagine_a_long_string_made_up_of_a_mish_mash_of_letters_and_numbers_because_it_is_encrypted',
            'x-forwarded-for': '172.18.0.1',
            'x-forwarded-port': '60884',
            'x-forwarded-proto': 'http',
            'x-forwarded-host': 'localhost:8008',
            host: 'localhost:8013'
          },
          remoteAddress: '127.0.0.1',
          remotePort: 51170
        }
      })

      it('returns version containing only the key properties we care about', () => {
        const { req } = HapiPinoSerializersService.go()

        expect(req(requestObject)).to.equal({
          id: '1737736750350:9bc56d13c48b:618:m6azkwqb:10004',
          method: 'get',
          url: '/bill-runs',
          query: {}
        })
      })
    })

    describe('and the function "res" when provided with a pino serialized request object', () => {
      let responseObject

      beforeEach(() => {
        responseObject = {
          statusCode: 200,
          headers: {
            'strict-transport-security': 'max-age=15768000',
            'x-frame-options': 'DENY',
            'x-xss-protection': '0',
            'x-download-options': 'noopen',
            'x-content-type-options': 'nosniff',
            'cache-control': 'no-cache',
            'set-cookie': [
              'wrlsCrumb=qLVnKWrMY3HUAgrqg5tDOM_QL12lmcft2e3Ytq0kp9y; Secure; HttpOnly; SameSite=Strict; Path=/'
            ],
            'content-type': 'text/html; charset=utf-8',
            vary: 'accept-encoding',
            'content-encoding': 'gzip'
          }
        }
      })

      it('returns version containing only the key properties we care about', () => {
        const { res } = HapiPinoSerializersService.go()

        expect(res(responseObject)).to.equal({
          statusCode: 200
        })
      })
    })
  })
})
