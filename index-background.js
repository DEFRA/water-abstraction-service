// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config()

const Blipp = require('blipp')
const Good = require('@hapi/good')
const GoodWinston = require('good-winston')
const Hapi = require('@hapi/hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')

const config = require('./config')
const routes = require('./src/routes/background.js')
const db = require('./src/lib/connectors/db')
const { validate } = require('./src/lib/validate')

// Initialise logger
const { logger } = require('./src/logger')
const goodWinstonStream = new GoodWinston({ winston: logger })

// Define server
const server = Hapi.server({
  ...config.serverBackground
})

const plugins = [
  require('./src/lib/worker_manager').plugin
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
      await server.start()
      const name = `${process.env.SERVICE_NAME}-background`
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
    logger.info('Stopping water background service')

    await server.stop()
    logger.info('1/3: Hapi server stopped')

    await server.workerManager.stop()
    logger.info('2/3: Bull MQ stopped')

    logger.info('Waiting 10 secs to allow jobs to finish')

    setTimeout(async () => {
      await db.pool.end()
      logger.info('3/3: Connection pool closed')

      return process.exit(0)
    }, 10000)
  })

if (!module.parent) {
  start()
}

module.exports = {
  server,
  start
}
