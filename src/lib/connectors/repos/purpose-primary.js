const { PurposePrimary } = require('../bookshelf')
const helpers = require('./lib/helpers')

exports.findOneByLegacyId = id => helpers.findOne(PurposePrimary, 'legacyId', id)
exports.create = data => helpers.create(PurposePrimary, data)
