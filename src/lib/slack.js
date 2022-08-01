const os = require('os')
const hostname = os.hostname()
const { logger } = require('../logger')

// contains generic functions unrelated to a specific component
const rp = require('request-promise-native').defaults({
  strictSSL: false
})

function post (message) {
  if (!process.env.SLACK_HOOK) {
    return
  }

  const msg = message + ' - ' + hostname + ' - ' + process.env.NODE_ENV
  logger.info(`Slack: ${msg}`)
  const uri = 'https://hooks.slack.com/services/' + process.env.SLACK_HOOK
  const options = {
    method: 'POST',
    url: uri,
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    form: { payload: '{"channel": "#beta-activity", "username": "Gerald The Water Buffalo", "text": "' + msg + '", "icon_emoji": ":water_buffalo:"}' }
  }

  return rp(options)
    .catch((err) => {
      logger.error('Slack error', err)
    })
}

module.exports = {
  post
}
