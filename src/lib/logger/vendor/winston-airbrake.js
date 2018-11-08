/**
 * Original source:  https://github.com/dstevensio/winston-airbrake/blob/master/lib/winston-airbrake.js
 * Modified to use newer airbrake-js library and to add support for proxy servers.
 */

// winston-airbrake.js: Transport for outputting logs to Airbrake
var request = require('request');
var util = require('util');
var winston = require('winston');
var AirbrakeClient = require('airbrake-js');

var Airbrake = exports.Airbrake = winston.transports.Airbrake = function (options) {
  this.name = 'airbrake';
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.handleExceptions = options.handleExceptions || false;

  if (!options.apiKey) {
    throw new Error('You must specify an airbrake API Key to use winston-airbrake');
  }

  const clientOptions = {
    projectId: options.projectId,
    projectKey: options.apiKey,
    host: options.host
  };

  if (options.proxy) {
    clientOptions.request = request.defaults({ proxy: options.proxy });
  }

  this.airbrakeClient = new AirbrakeClient(clientOptions);
};

util.inherits(Airbrake, winston.Transport);

Airbrake.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  var err = new Error(msg);

  if (self.silent) {
    return callback(null, true);
  }

  err.type = level;
  if (meta) {
    const {stack = '', url = '', component = '', action = '', params = {}, session = {}} = meta;

    err.stack = stack;
    err.url = url;
    err.component = component;
    err.action = action;
    err.params = params;
    err.session = session;
  }

  self.airbrakeClient.notify(err, function (err, url) {
    if (err) {
      return callback(err, false);
    }
    return callback(null, { 'url': url });
  });
};
