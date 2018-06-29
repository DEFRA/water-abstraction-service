'use strict';

/**
 * Based on {@link https://github.com/DEFRA/data-returns-pi-frontend/blob/develop/src/lib/logging.js}
 */
const winston = require('winston');
const Joi = require('joi');
const Airbrake = require('./vendor/winston-airbrake').Airbrake;

const logger = new (winston.Logger)();

// Setup transports
const defaults = {
  colorize: true,
  silent: false,
  timestamp: true,
  json: false,
  showLevel: true,
  handleExceptions: true,
  humanReadableUnhandledException: true
};

const init = (config = {}) => {
  // Validate the provided config object
  const schema = {
    level: Joi.string().allow('debug', 'verbose', 'info', 'warn', 'error').default('info'),
    airbrakeKey: Joi.string(),
    airbrakeHost: Joi.string(),
    airbrakeLevel: Joi.string().allow('debug', 'verbose', 'info', 'warn', 'error').default('error')
  };

  const { error, value: options } = Joi.validate(config, schema);

  if (error) {
    throw new Error('Invalid log configuration', error);
  }

  // Default console transport
  logger.add(winston.transports.Console, { ...defaults, level: options.level });

  // Optional Airbrake transport
  if (options.airbrakeKey && options.airbrakeHost) {
    const airbrakeOptions = {
      apiKey: options.airbrakeKey,
      host: options.airbrakeHost,
      projectId: true,
      level: options.airbrakeLevel,
      env: process.env.NODE_ENV
    };
    logger.add(Airbrake, airbrakeOptions);
  }
};

module.exports = logger;
module.exports.init = init;
