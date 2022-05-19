const { mapCsv } = require('./mapper')
const { validate } = require('./validator')

exports.validator = validate
exports.mapper = mapCsv
