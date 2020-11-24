// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('@hapi/good');
const GoodWinston = require('good-winston');
const Hapi = require('@hapi/hapi');
const HapiAuthJwt2 = require('hapi-auth-jwt2');
const Vision = require('@hapi/vision');
const Nunjucks = require('nunjucks');

const moment = require('moment');
moment.locale('en-gb');

// -------------- Require project code -----------------
const config = require('./config');
const messageQueue = require('./src/lib/message-queue');
const routes = require('./src/routes/water.js');
const notify = require('./src/modules/notify');
const returnsNotifications = require('./src/modules/returns-notifications');
const batchNotifications = require('./src/modules/batch-notifications/lib/jobs/init-batch-notifications');
const db = require('./src/lib/connectors/db');
const CatboxRedis = require('@hapi/catbox-redis');

// Notification cron jobs
require('./src/modules/batch-notifications/cron').scheduleJobs();

// Initialise logger
const { logger } = require('./src/logger');
const goodWinstonStream = new GoodWinston({ winston: logger });

// Define server
const server = Hapi.server({
  ...config.server,
  cache: [
    {
      provider: {
        constructor: CatboxRedis,
        options: config.redis
      }
    }
  ]
});

const plugins = [
  require('./src/lib/message-queue').plugin,
  require('./src/modules/billing/register-subscribers'),
  require('./src/modules/invoice-accounts/register-subscribers'),
  require('./src/modules/returns/register-subscribers'),
  require('./src/plugins/internal-calling-user'),
  require('./src/modules/address-search/plugin'),
  require('./src/modules/billing/register-subscribers')
];

const registerServerPlugins = async (server) => {
  // Service plugins
  await server.register(plugins);

  // Third-party plugins
  await server.register({
    plugin: Good,
    options: {
      ...config.good,
      reporters: {
        winston: [goodWinstonStream]
      }
    }
  });
  await server.register({
    plugin: Blipp,
    options: config.blipp
  });

  // JWT token auth
  await server.register(HapiAuthJwt2);

  await server.register(Vision);
};

const configureServerAuthStrategy = (server) => {
  server.auth.strategy('jwt', 'jwt', {
    ...config.jwt,
    validate: async (decoded) => ({ isValid: !!decoded.id })
  });
  server.auth.default('jwt');
};

const configureMessageQueue = async (server) => {
  notify(messageQueue).registerSubscribers();
  await returnsNotifications(messageQueue).registerSubscribers();
  await batchNotifications.registerSubscribers(messageQueue);
  server.log('info', 'Message queue started');
};

const configureNunjucks = async (server) => {
  server.views({
    engines: {
      html: {
        compile: (src, options) => {
          const template = Nunjucks.compile(src, options.environment);

          return (context) => {
            return template.render(context);
          };
        },

        prepare: (options, next) => {
          options.compileOptions.environment = Nunjucks.configure(options.path, { watch: false });

          return next();
        }
      }
    },
    relativeTo: __dirname,
    path: 'src/views'
  });
};

const start = async function () {
  try {
    await registerServerPlugins(server);
    configureServerAuthStrategy(server);
    server.route(routes);
    await configureMessageQueue(server);
    await configureNunjucks(server);

    if (!module.parent) {
      await server.start();
      const name = process.env.SERVICE_NAME;
      const uri = server.info.uri;
      server.log('info', `Service ${name} running at: ${uri}`);
    }
  } catch (err) {
    logger.error('Failed to start server', err);
  }
};

const processError = message => err => {
  logger.error(message, err);
  process.exit(1);
};

process
  .on('unhandledRejection', processError('unhandledRejection'))
  .on('uncaughtException', processError('uncaughtException'))
  .on('SIGINT', async () => {
    logger.info('Stopping water service');

    await server.stop();
    logger.info('1/3: Hapi server stopped');

    await server.messageQueue.stop();
    logger.info('2/3: Message queue stopped');
    logger.info('Waiting 5 secs to allow pg-boss to finish');

    setTimeout(async () => {
      await db.pool.end();
      logger.info('3/3: Connection pool closed');

      return process.exit(0);
    }, 5000);
  });

if (!module.parent) {
  start();
}

module.exports = server;
module.exports._start = start;
