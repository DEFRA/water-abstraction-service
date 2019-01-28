/**
 * Abstraction over request-promise-native for making requests to
 * downstream services that are always JSON content type and
 * always pass a JWT auth header.
 */
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

module.exports = {
  get: url => {
    const options = {
      url,
      method: 'GET',
      json: true,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    };
    return rp(options);
  }
};
