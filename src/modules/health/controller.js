const pkg = require('../../../package.json')

const getStatus = async () => {
  return {
    version: pkg.version
  }
}

exports.getStatus = getStatus
