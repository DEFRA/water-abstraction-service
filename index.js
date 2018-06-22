// provides all API services consumed by VML and VML Admin front ends
require('dotenv').config();

// -------------- Require vendor code -----------------
const Blipp = require('blipp');
const Good = require('good');
const GoodWinston = require('good-winston');
const Hapi = require('hapi');
const HapiAuthJwt2 = require('hapi-auth-jwt2');

// -------------- Require project code -----------------
const config = require('./config');
const messageQueue = require('./src/lib/message-queue');
const routes = require('./src/routes/water.js');

// Initialise logger
const logger = require('./src/lib/logger');
const goodWinstonStream = new GoodWinston({ winston: logger });
logger.init(config.logger);

// Define server
const server = Hapi.server(config.server);

/**
 * Validate JWT token
 * @param {Object} decoded - decoded data from JWT
 * @param {Object} request - current request
 * @return {Object} - result
 */
async function validate (decoded, request) {
  console.log('decoded', decoded);
  if (!decoded.id) {
    console.log('boo... JWT failed');
    return { isValid: false };
  } else {
    console.log('huzah... JWT OK');
    return { isValid: true };
  }
}

const start = async function () {
  try {
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
    server.auth.strategy('jwt', 'jwt', {
      ...config.jwt,
      validate
    });
    server.auth.default('jwt');

    // Import routes
    server.route(routes);

    if (!module.parent) {
      await server.start();
      const name = process.env.servicename;
      const uri = server.info.uri;
      console.log(`Service ${name} running at: ${uri}`);
    }

    // Set up PG Boss message queue
    await messageQueue.start();
    const { registerSubscribers } = require('./src/modules/notify')(messageQueue);
    registerSubscribers();
    logger.info('Message queue started');
  } catch (err) {
    logger.error(err);
  }
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

start();

module.exports = server;
