const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false,
});
const {APIClient} = require('hapi-pg-rest-api');

const licences = new APIClient(rp, {
  endpoint: `${ process.env.PERMIT_URI }licence`,
  headers : {
    Authorization : process.env.JWT_TOKEN
  }
});

module.exports = {licences};
