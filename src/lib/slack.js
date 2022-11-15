const os = require('os')
const hostname = os.hostname()
const { logger } = require('../logger')

const { environment, slackHook } = require('../../config')

// contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
  strictSSL: false
})

function post (message) {
  if (!slackHook) {
    return
  }

  const msg = `${message} - ${hostname} - ${environment}`
  logger.info(`Slack: ${msg}`)
  const uri = `https://hooks.slack.com/services/${slackHook}`
  const options = {
    method: 'POST',
    url: uri,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: { payload: `{"channel": "#beta-activity", "username": "Gerald The Water Buffalo", "text": "${msg}", "icon_emoji": ":water_buffalo:"}` }
  }

  return rp(options)
    .catch((err) => {
      logger.error('Slack error', err.stack)
    })
}

module.exports = {
  post
}
