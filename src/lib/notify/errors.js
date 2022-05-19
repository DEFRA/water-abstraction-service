
class MessageTypeError extends Error {
  constructor (message) {
    super(message)
    this.name = 'MessageTypeError'
  }
}

class NotifyIdError extends Error {
  constructor (message) {
    super(message)
    this.name = 'NotifyIdError'
  }
}

class AlreadySentError extends Error {
  constructor (message) {
    super(message)
    this.name = 'AlreadySentError'
  }
}

module.exports = {
  MessageTypeError,
  NotifyIdError,
  AlreadySentError
}
