const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const { APIClient } = require('hapi-pg-rest-api');
const config = require('../../../config');

const licences = new APIClient(rp, {
  endpoint: `${process.env.PERMIT_URI}licence`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const expiringLicences = new APIClient(rp, {
  endpoint: `${process.env.PERMIT_URI}expiring_licences?filter={licence_type_id:${config.licence.typeId},licence_regime_id:${config.licence.regimeId}}`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

module.exports = {
  licences,
  expiringLicences
};
