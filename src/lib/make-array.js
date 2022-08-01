'use strict'

const { isArray } = require('lodash')

const makeArray = value => isArray(value) ? value : [value]

module.exports = makeArray
