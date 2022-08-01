'use strict'

const crypto = require('crypto')

/**
 * Creates an MD5 hash output in a 32 byte hex string
 *
 * @param {String} input The input string to be hashed
 */
const createMd5Hash = input => crypto.createHash('md5')
  .update(input)
  .digest('hex')

exports.createMd5Hash = createMd5Hash
