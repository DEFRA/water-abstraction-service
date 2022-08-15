'use strict'

// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config()

// -------------- Require vendor code -----------------
const Blipp = require('blipp')
const Good = require('@hapi/good')
const GoodWinston = require('good-winston')
const Hapi = require('@hapi/hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')
const Vision = require('@hapi/vision')
const Nunjucks = require('nunjucks')
const moment = require('moment')
moment.locale('en-gb')

// -------------- Require project code -----------------
const config = require('./config')
const routes = require('./src/routes/water.js')
const notify = require('./src/modules/notify')
const returnsNotifications = require('./src/modules/returns-notifications')
const db = require('./src/lib/connectors/db')
const CatboxRedis = require('@hapi/catbox-redis')
const { validate } = require('./src/lib/validate')

// Initialise logger
const { logger } = require('./src/logger')
const goodWinstonStream = new GoodWinston({ winston: logger })

// Define server
const server = Hapi.server({
  ...config.server,
  cache: [
    {
      provider: {
        constructor: CatboxRedis,
        options: config.redis.connection
      }
    }
  ]
})

const plugins = [
  require('./src/lib/message-queue-v2').plugin,
  require('./src/modules/returns/register-subscribers'),
  require('./src/modules/address-search/plugin'),
  require('./src/modules/billing/register-subscribers'),
  require('./src/modules/batch-notifications/register-subscribers'),
  require('./src/modules/gauging-stations/register-subscribers'),
  require('./src/modules/charge-versions-upload/register-subscribers'),
  require('./src/modules/charge-versions/plugin').plugin
]

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

  await server.register(Vision)

  // Add Hapi-swagger in test environments
  if (config.featureToggles.swagger) {
    await server.register([
      {
        plugin: require('@hapi/vision')
      },
      {
        plugin: require('@hapi/inert')
      },
      {
        plugin: require('hapi-swagger'),
        options: {
          info: {
            title: 'Test API Documentation',
            version: require('./package.json').version
          },
          pathPrefixSize: 3
        }
      }
    ])
  }
}

const configureServerAuthStrategy = (server) => {
  server.auth.strategy('jwt', 'jwt', {
    ...config.jwt,
    validate
  })
  server.auth.default('jwt')
}

const configureMessageQueue = async (server) => {
  notify.registerSubscribers(server.queueManager)
  returnsNotifications.registerSubscribers(server.queueManager)
  server.log('info', 'Message queue started')
}

const configureNunjucks = async (server) => {
  server.views({
    engines: {
      html: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },

        prepare: (options, next) => {
          options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false })

          return next()
        }
      }
    },
    relativeTo: __dirname,
    path: 'src/views'
  })
}

const start = async function () {
  try {
    await registerServerPlugins(server)
    configureServerAuthStrategy(server)
    server.route(routes)
    await configureMessageQueue(server)
    await configureNunjucks(server)

    if (!module.parent) {
      await server.start()
      const name = process.env.SERVICE_NAME
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
