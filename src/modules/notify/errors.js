class TemplateNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'TemplateNotFoundError';
  }
}
class MessageTypeError extends Error {
  constructor (message) {
    super(message);
    this.name = 'MessageTypeError';
  }
}

class NotificationNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NotificationNotFoundError';
  }
}

class NotifyIdError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NotifyIdError';
  }
}

class AlreadySentError extends Error {
  constructor (message) {
    super(message);
    this.name = 'AlreadySentError';
  }
}

module.exports = {
  TemplateNotFoundError,
  MessageTypeError,
  NotificationNotFoundError,
  NotifyIdError,
  AlreadySentError
};
