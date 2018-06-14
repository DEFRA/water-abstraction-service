'use strict';

const { APIClient } = require('hapi-pg-rest-api');
const urlJoin = require('url-join');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

// Create a client that consumes the /notification endpoint that
// this project exposes in /controllers/notifications.
const client = new APIClient(rp, {
  endpoint: urlJoin(process.env.WATER_URI, 'notification'),
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Gets the most recent notification for the given email address.
 * @param {String} emailAddress
 */
client.getLatestEmailByAddress = emailAddress => {
  const filter = { recipient: emailAddress, message_type: 'email' };
  const sort = { send_after: -1 };
  const pagination = { page: 1, perPage: 1 };
  return client.findMany(filter, sort, pagination);
};

module.exports = client;
