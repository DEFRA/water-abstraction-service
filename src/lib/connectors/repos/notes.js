'use strict'

const { Note } = require('../bookshelf')
const helpers = require('./lib/helpers')

const withRelated = [
  'user'
]

const create = async data => helpers.create(Note, data)

const update = (noteId, changes) =>
  Note
    .forge({ noteId })
    .save(changes)

/**
 * Find single note by ID
 * @param {String} noteId
 * @return {Promise<Object>}
 */
const findOne = async noteId => helpers.findOne(Note, 'noteId', noteId, withRelated)

const findByChargeVersionId = async chargeVersionId => {
  const model = await Note
    .forge()
    .where('type', 'charge_version')
    .where('type_id', chargeVersionId)
    .fetch({ require: false })

  return model && model.toJSON()
}

exports.create = create
exports.update = update
exports.findOne = findOne
exports.findByChargeVersionId = findByChargeVersionId
