'use strict'

const pkg = require('../../../package.json')
const { version } = pkg

const getStatus = async (_request, h) => {
  return h.response({ version }).code(200)
}

module.exports = {
  getStatus
}
