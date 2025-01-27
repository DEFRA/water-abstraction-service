'use strict'

/**
 * Plugin that handles logging for the application
 *
 * {@link https://github.com/pinojs/hapi-pino|hapi-pino} wraps the
 * {@link https://github.com/pinojs/pino#low-overhead|pino} Node JSON logger as a logger for Hapi. We pretty much use it
 * as provided with its defaults.
 *
 * @module HapiPinoPlugin
 */

const HapiPino = require('hapi-pino')

const HapiPinoIgnoreRequestService = require('../lib/services/hapi-pino-ignore-request.service.js')
const HapiPinoSerializersService = require('../lib/services/hapi-pino-serializers.service.js')

const config = require('../../config.js')

/**
 * Return test configuration options for the logger
 *
 * When we run our unit tests we don't want the output polluted by noise from the logger. So as a default we set the
 * configuration to tell hapi-pino to ignore all events.
 *
 * But there will be times when trying to diagnose an issue that we will want log output. So using an env var we can
 * override the default and tell hapi-pino to log everything as normal.
 *
 * In both cases using the
 * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax|spread operator} on
 * the returned value will allow it to be incorporated with our default hapi-pino options.
 */
const testOptions = () => {
  if (process.env.NODE_ENV !== 'test' || config.log.logInTest) {
    return {
      level: config.log.level
    }
  }

  return {
    // Don't log requests etc
    logEvents: false,
    // Don't log anything tagged with DEBUG or info, for example, req.log(['INFO'], 'User is an admin')
    ignoredEventTags: { log: ['DEBUG', 'INFO'], request: ['DEBUG', 'INFO'] }
  }
}

const HapiPinoPlugin = () => {
  return {
    plugin: HapiPino,
    options: {
      // Include our test configuration
      ...testOptions(),
      // When not in the production environment we want a 'pretty' version of the JSON to make it easier to grok what has
      // happened
      transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
      // Redact Authorization headers, see https://getpino.io/#/docs/redaction
      redact: ['req.headers.authorization'],
      // We want our logs to focus on the main requests and not become full of 'noise' from requests for /assets or
      // pings from the AWS load balancer to /status. We pass this function to hapi-pino to control what gets filtered
      // https://github.com/pinojs/hapi-pino#optionsignorefunc-options-request--boolean
      ignoreFunc: HapiPinoIgnoreRequestService.go,
      // Add the request params as pathParams to the response event log. This, along with `logPathParams` and
      // `logQueryParams` helps us see what data was sent in the request to the app in the event of an error.
      logPathParams: true,
      // Add the request payload as `payload:` to the response event log
      logPayload: true,
      // Add the request query as `queryParams:` to the response event log
      logQueryParams: true,
      serializers: HapiPinoSerializersService.go()
    }
  }
}

module.exports = HapiPinoPlugin
