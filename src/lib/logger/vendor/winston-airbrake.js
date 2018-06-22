/**
 * Original source:  https://github.com/dstevensio/winston-airbrake/blob/master/lib/winston-airbrake.js
 * Modified to use newer airbrake-js library
 */

// winston-airbrake.js: Transport for outputting logs to Airbrake
var util = require('util');
var winston = require('winston');
var AirbrakeClient = require('airbrake-js');

var Airbrake = exports.Airbrake = winston.transports.Airbrake = function (options) {
  this.name = 'airbrake';
  this.level = options.level || 'info';
  this.silent = options.silent || false;
  this.handleExceptions = options.handleExceptions || false;

  if (options.apiKey) {
    this.airbrakeClient = new AirbrakeClient({ projectId: options.projectId, projectKey: options.apiKey, host: options.host });
  } else {
    throw new Error('You must specify an airbrake API Key to use winston-airbrake');
  }
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
    err.stack = meta.stack || '';
    err.url = meta.url || '';
    err.component = meta.component || '';
    err.action = meta.action || '';
    err.params = meta.params || {};
    err.session = meta.session || {};
  }

  self.airbrakeClient.notify(err, function (err, url) {
    if (err) {
      return callback(err, false);
    } else {
      return callback(null, { 'url': url });
    }
  });
};
