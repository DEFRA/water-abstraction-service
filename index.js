'use strict'

require('dotenv').config()

const Blipp = require('blipp')
const CatboxRedis = require('@hapi/catbox-redis')
const Good = require('@hapi/good')
const GoodWinston = require('good-winston')
const Hapi = require('@hapi/hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')
const Vision = require('@hapi/vision')
const moment = require('moment')
const Nunjucks = require('nunjucks')

const config = require('./config')
const db = require('./src/lib/connectors/db')
const { logger } = require('./src/logger')
const routes = require('./src/routes/water.js')
const { validate } = require('./src/lib/validate')

const notify = require('./src/modules/notify')
const returnsNotifications = require('./src/modules/returns-notifications')

// Hapi/good is used to log ops statistics, request responses and server log events. It's the reason you'll see
// 2022-08-18T22:42:39.697Z - info: 220818/224239.697, [ops] memory: 108Mb, uptime (seconds): 63.480054702, load: [0.09,0.11,0.09]
// throughout our logs. This call initialises it
const goodWinstonStream = new GoodWinston({ winston: logger })

// This changes the locale for moment globally to English (United Kingdom). Any new instances of moment will use this
// rather than the default 'en-US'
moment.locale('en-gb')

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
  require('./src/lib/queue-manager').plugin,
  require('./src/modules/returns/register-subscribers'),
  require('./src/modules/address-search/plugin'),
  require('./src/modules/billing/register-subscribers'),
  require('./src/modules/batch-notifications/register-subscribers'),
  require('./src/modules/gauging-stations/register-subscribers'),
  require('./src/modules/charge-versions-upload/register-subscribers'),
  require('./src/modules/charge-versions/plugin').plugin
]

const _registerServerPlugins = async (server) => {
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

const _configureServerAuthStrategy = (server) => {
  server.auth.strategy('jwt', 'jwt', {
    ...config.jwt,
    validate
  })
  server.auth.default('jwt')
}

const _configureMessageQueue = async (server) => {
  notify.registerSubscribers(server.queueManager)
  returnsNotifications.registerSubscribers(server.queueManager)
  server.log('info', 'Message queue started')
}

const _configureNunjucks = async (server) => {
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
    await _registerServerPlugins(server)
    _configureServerAuthStrategy(server)
    server.route(routes)
    await _configureMessageQueue(server)
    await _configureNunjucks(server)

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

const _processError = message => err => {
  logger.error(message, err)
  process.exit(1)
}

process
  .on('unhandledRejection', _processError('unhandledRejection'))
  .on('uncaughtException', _processError('uncaughtException'))
  .on('SIGINT', async () => {
    logger.info('Stopping hapi server: existing requests have 25 seconds to complete')
    await server.stop({ timeout: 25 * 1000 })

    logger.info('Stopping BullMQ workers')
    await server.queueManager.closeAll()

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
