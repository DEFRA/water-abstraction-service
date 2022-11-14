'use strict'

require('dotenv').config()

const Blipp = require('blipp')
const Good = require('@hapi/good')
const GoodWinston = require('good-winston')
const Hapi = require('@hapi/hapi')
const HapiAuthJwt2 = require('hapi-auth-jwt2')
const Vision = require('@hapi/vision')
const moment = require('moment')
const Nunjucks = require('nunjucks')

const config = require('./config')
const db = require('./src/lib/connectors/db')
const { JobRegistrationService } = require('./src/lib/queue-manager/job-registration-service')
const { logger } = require('./src/logger')
const routes = require('./src/routes/water.js')
const { validate } = require('./src/lib/validate')

// Hapi/good is used to log ops statistics, request responses and server log events. It's the reason you'll see
// 2022-08-18T22:42:39.697Z - info: 220818/224239.697, [ops] memory: 108Mb, uptime (seconds): 63.480054702, load: [0.09,0.11,0.09]
// throughout our logs. This call initialises it
const goodWinstonStream = new GoodWinston({ winston: logger })

// This changes the locale for moment globally to English (United Kingdom). Any new instances of moment will use this
// rather than the default 'en-US'
moment.locale('en-gb')

// Define server
const server = Hapi.server({
  ...config.server
})

const plugins = [
  require('./src/lib/queue-manager').plugin
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
}

const _configureServerAuthStrategy = (server) => {
  server.auth.strategy('jwt', 'jwt', {
    ...config.jwt,
    validate
  })
  server.auth.default('jwt')
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
    await _configureNunjucks(server)

    // TODO: Ideally we wouldn't bother registering all the Queues and workers when running unit tests. So, we would
    // move this into the `if (!module.parent)` block. But when we do the tests only run the first few and then exit.
    // We should look into what's happening and why we can't move it there.
    JobRegistrationService.go(server.queueManager)

    if (!module.parent) {
      await server.start()
      const name = process.env.SERVICE_NAME
      const uri = server.info.uri
      server.log('info', `Service ${name} running at: ${uri}`)
    }
  } catch (err) {
    logger.error('Failed to start server', err.stack)
  }
}

const _processError = message => err => {
  logger.error(message, err.stack)
  process.exit(1)
}

process
  .on('unhandledRejection', _processError('unhandledRejection'))
  .on('uncaughtException', _processError('uncaughtException'))
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
