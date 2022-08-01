const { APIClient } = require('@envage/hapi-pg-rest-api')

const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
})

const create = endpoint => {
  return new APIClient(rp, {
    endpoint,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  })
}

exports.create = create
