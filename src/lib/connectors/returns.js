const {APIClient} = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const returns = new APIClient(rp, {
  endpoint: `${process.env.RETURNS_URI}/returns`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const versions = new APIClient(rp, {
  endpoint: `${process.env.RETURNS_URI}/versions`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const lines = new APIClient(rp, {
  endpoint: `${process.env.RETURNS_URI}/lines`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

module.exports = {
  returns,
  versions,
  lines
};
