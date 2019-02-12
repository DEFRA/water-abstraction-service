// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');
const HapiAuthJwt2 = require('hapi-auth-jwt2');
const Vision = require('vision');
const Nunjucks = require('nunjucks');

const moment = require('moment');
moment.locale('en-gb');

// -------------- Require project code -----------------
const config = require('./config');
const messageQueue = require('./src/lib/message-queue');
const routes = require('./src/routes/water.js');
const notify = require('./src/modules/notify');
const returnsNotifications = require('./src/modules/returns-notifications');
const returnsInvitations = require('./src/modules/returns-invitation');
const importer = require('./src/modules/import');
const returnsUpload = require('./src/modules/returns/lib/jobs/init-upload');

// Initialise logger
const logger = require('./src/lib/logger');
const goodWinstonStream = new GoodWinston({ winston: logger });
logger.init(config.logger);

// Define server
const server = Hapi.server(config.server);

const registerServerPlugins = async (server) => {
  // Third-party plugins
  await server.register({
    plugin: Good,
    options: { ...config.good,
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
  await messageQueue.start();
  notify(messageQueue).registerSubscribers();
  await importer(messageQueue).registerSubscribers();
  await returnsNotifications(messageQueue).registerSubscribers();
  await returnsInvitations(messageQueue).registerSubscribers();
  await returnsUpload.registerSubscribers(messageQueue);
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

process.on('unhandledRejection', (err) => {
  logger.error('Server unhandledRejection', err);
  process.exit(1);
});

start();

module.exports = server;
