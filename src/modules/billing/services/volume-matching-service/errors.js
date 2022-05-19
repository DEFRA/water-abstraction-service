'use strict'

class ChargeElementMatchingError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ChargeElementMatchingError'
  }
}

exports.ChargeElementMatchingError = ChargeElementMatchingError
