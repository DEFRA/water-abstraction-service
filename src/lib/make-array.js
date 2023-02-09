'use strict'

const makeArray = (value) => {
  return Array.isArray(value) ? value : [value]
}

module.exports = makeArray
