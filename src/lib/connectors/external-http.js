const rp = require('request-promise-native').defaults({
  strictSSL: false
})

exports.externalHttp = options => rp(options)
