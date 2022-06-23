const { PurposeSecondary } = require('../bookshelf')
const helpers = require('./lib/helpers')

exports.findOneByLegacyId = id => helpers.findOne(PurposeSecondary, 'legacyId', id)
exports.create = data => helpers.create(PurposeSecondary, data)
