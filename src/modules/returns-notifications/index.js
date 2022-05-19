const returnsNotificationSend = require('./lib/returns-notification-send')

module.exports = {
  registerSubscribers: queueManager => {
    queueManager.register(returnsNotificationSend)
  }
}
