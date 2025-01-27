'use strict'

/**
 * Used by HapiPinoPlugin to customise the log output for the `req` and `res` objects returned by pino
 * @module HapiPinoSerializersService
 */

/**
 * Used by HapiPinoPlugin to customise the log output for the `req` and `res` objects returned by pino
 *
 * > We think this is how things work. Why are JavaScript loggers so complex!?
 *
 * [Hapi-pino](https://github.com/hapijs/hapi-pino) takes will pass the request (`req`) and response (`res`) objects to
 * [Pino](https://github.com/pinojs/pino), which then uses
 * [pino-std-serializers](https://github.com/pinojs/pino-std-serializers) to serialize them into what we see in the
 * logs.
 *
 * These objects though are very verbose, for example.
 *
 * ```javascript
 * {
 *   req: {
 *     "id": "1737736750350:9bc56d13c48b:618:m6azkwqb:10004",
 *     "method": "get",
 *     "url": "/bill-runs",
 *     "query": {},
 *     "headers": {
 *       "connection": "keep-alive",
 *       "cache-control": "max-age=0",
 *       "sec-ch-ua": "\"Not A(Brand\";v=\"8\", \"Chromium\";v=\"132\", \"Google Chrome\";v=\"132\"",
 *       "sec-ch-ua-mobile": "?0",
 *       "sec-ch-ua-platform": "\"macOS\"",
 *       "upgrade-insecure-requests": "1",
 *       "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
 *       "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng;q=0.8,application/signed-exchange;v=b3;q=0.7",
 *       "sec-fetch-site": "same-origin",
 *       "sec-fetch-mode": "navigate",
 *       "sec-fetch-user": "?1",
 *       "sec-fetch-dest": "document",
 *       "referer": "http://localhost:8008/system/bill-runs/a13ad1c9-331d-4ceb-9b61-cbd411a79e7b/cancel",
 *       "accept-encoding": "gzip, deflate, br, zstd",
 *       "accept-language": "en-GB,en;q=0.9,en-US;q=0.8",
 *       "cookie": "imagine_a_long_string_made_up_of_a_mish_mash_of_letters_and_numbers_because_it_is_encrypted",
 *       "x-forwarded-for": "172.18.0.1",
 *       "x-forwarded-port": "60884",
 *       "x-forwarded-proto": "http",
 *       "x-forwarded-host": "localhost:8008",
 *       "host": "localhost:8013"
 *     },
 *     "remoteAddress": "127.0.0.1",
 *     "remotePort": 51170
 *   },
 *   res: {
 *     "statusCode": 200,
 *     "headers": {
 *       "strict-transport-security": "max-age=15768000",
 *       "x-frame-options": "DENY",
 *       "x-xss-protection": "0",
 *       "x-download-options": "noopen",
 *       "x-content-type-options": "nosniff",
 *       "cache-control": "no-cache",
 *       "set-cookie": [
 *         "wrlsCrumb=qLVnKWrMY3HUAgrqg5tDOM_QL12lmcft2e3Ytq0kp9y; Secure; HttpOnly; SameSite=Strict; Path=/"
 *       ],
 *       "content-type": "text/html; charset=utf-8",
 *       "vary": "accept-encoding",
 *       "content-encoding": "gzip"
 *     }
 *   },
 *   responseTime: 47
 * }
 * ```
 *
 * We realised we were only using a tenth of what was output. The rest was just noise.
 *
 * Thankfully, **Hapi-pino** allows us to provide our own
 * [serializers](https://github.com/hapijs/hapi-pino?tab=readme-ov-file#optionsserializers--key-string-pinoserializerfn-)
 * that can take the serialized object **pino-std-serializers** returns and generate our own objects for logging.
 *
 * This service works alongside `app/plugins/hapi-pino.plugin.js` to remove the noise from our logs.
 *
 * @returns {object} an object containing functions to serialize the `req` and `res` objects returned by pino
 */
function go () {
  return {
    req: _req,
    res: _res
  }
}

/**
 * Transforms the serialized `req` object [pino-std-serializers](https://github.com/pinojs/pino-std-serializers) returns
 * so that we only output what we are care about, making our logs easier to work with.
 *
 * ```javascript
 * req: {
 *   "id": "1737742451819:9bc56d13c48b:1076:m6b2hu4a:10022",
 *   "method": "get",
 *   "url": "/return-versions/setup/4b385d95-3585-43ec-a4ec-039df63b288c/note",
 *   "query": {}
 * }
 * ```
 * @private
 */
function _req (req) {
  return {
    id: req.id,
    method: 'get',
    url: req.url,
    query: req.query
  }
}

/**
 * Transforms the serialized `res` object [pino-std-serializers](https://github.com/pinojs/pino-std-serializers) returns
 * so that we only output what we are care about, making our logs easier to work with.
 *
 * ```javascript
 * res: {
 *   "statusCode": 302
 * }
 * ```
 * @private
 */
function _res (res) {
  return {
    statusCode: res.statusCode
  }
}

module.exports = {
  go
}
