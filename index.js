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

async function start () {
  try {
    // Set up PG Boss message queue
    await messageQueue.start();
    const { registerSubscribers } = require('./src/modules/notify')(messageQueue);
    registerSubscribers();
    logger.info('Message queue started');

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

    // Start server
    await server.start();
    server.log(`Server started on ${server.info.uri} port ${server.info.port}`);
  } catch (err) {
    logger.error(err);
  }
}

// Start the server if not testing with Lab
if (!module.parent) {
  start();
}

module.exports = server;
