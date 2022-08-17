'use strict'

// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config()

const Blipp = require('blipp')
const Good = require('@hapi/good')
const GoodWinston = require('good-winston')
const Hapi = require('@hapi/hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')
const moment = require('moment')
moment.locale('en-gb')

const config = require('./config')
const routes = require('./src/routes/background.js')
const db = require('./src/lib/connectors/db')
const { validate } = require('./src/lib/validate')
const { JobRegistrationService } = require('./src/lib/message-queue-v2/job-registration-service')

// Initialise logger
const { logger } = require('./src/logger')
const goodWinstonStream = new GoodWinston({ winston: logger })

// Define server
const server = Hapi.server({
  ...config.serverBackground
})

const plugins = [
  require('./src/lib/message-queue-v2').plugin
]

// Register plugins
const registerServerPlugins = async (server) => {
  // Service plugins
  await server.register(plugins)

  // Third-party plugins
  await server.register({
    plugin: Good,
    options: {
      ...config.good,
      reporters: {
        winston: [goodWinstonStream]
      }
    }
  })
  await server.register({
    plugin: Blipp,
    options: config.blipp
  })

  // JWT token auth
  await server.register(HapiAuthJwt2)
}

const configureServerAuthStrategy = (server) => {
  server.auth.strategy('jwt', 'jwt', {
    ...config.jwt,
    validate
  })
  server.auth.default('jwt')
}

const start = async function () {
  try {
    await registerServerPlugins(server)
    configureServerAuthStrategy(server)
    server.route(routes)

    if (!module.parent) {
      JobRegistrationService.go(server.queueManager)
      await server.start()
      const name = process.env.name || `${process.env.SERVICE_NAME}-background`
      const uri = server.info.uri
      server.log('info', `Service ${name} running at: ${uri}`)
    }
  } catch (err) {
    logger.error('Failed to start server', err)
  }
}

const processError = message => err => {
  logger.error(message, err.stack)
  process.exit(1)
}

process
  .on('unhandledRejection', processError('unhandledRejection'))
  .on('uncaughtException', processError('uncaughtException'))
  .on('SIGINT', async () => {
    logger.info('Stopping hapi server: existing requests have 25 seconds to complete')
    await server.stop({ timeout: 25 * 1000 })

    logger.info('Stopping BullMQ workers')
    await server.queueManager.stop()

    logger.info('Closing connection pool')
    await db.pool.end()

    logger.info("That's all folks!")
    return process.exit(0)
  })

if (!module.parent) {
  start()
}

module.exports = {
  server,
  start
}
