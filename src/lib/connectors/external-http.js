const rp = require('request-promise').defaults({
  strictSSL: false
})

exports.externalHttp = options => rp(options)
