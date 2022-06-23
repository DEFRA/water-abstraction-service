'use strict'

const { ChargeElement } = require('../bookshelf')

const helpers = require('./lib/helpers')

const create = data => helpers.create(ChargeElement, data)

exports.create = create
