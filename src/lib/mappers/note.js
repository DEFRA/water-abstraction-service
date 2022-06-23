'use strict'

const camelCaseKeys = require('../camel-case-keys')
const Note = require('../models/note')
const helpers = require('./lib/helpers')
const { createMapper } = require('../object-mapper')
const userMapper = require('./user')

const dbToModelMapper = createMapper()
  .map('noteId').to('id')
  .copy(
    'type',
    'typeId',
    'userId',
    'text',
    'licenceId'
  )

/**
 * Maps a row from water.notes to a Note model
 * @param {Object} data - camel cased as row
 * @return {Note}
 */
const dbToModel = data => {
  if (!data) {
    return null
  }

  return helpers.createModel(Note, camelCaseKeys(data), dbToModelMapper
    .map('user').to('user', userMapper.dbToModel)
  )
}

const pojoToModelMapper = createMapper()
  .copy(
    'text',
    'userId',
    'licenceId'
  )
  .map('user').to('user', userMapper.pojoToModel)

/**
 * Converts a plain object representation of a Note to a Note model
 * @param {Object} pojo
 * @return Note
 */
const pojoToModel = pojo =>
  helpers.createModel(Note, pojo, pojoToModelMapper)

/**
 * Maps data from note model back to the Bookshelf repo
 * @param {Note} noteModel
 * @return {Object}
 */
const modelToDb = noteModel => {
  const { id, scheduledNotifications, user, ...rest } = noteModel.toJSON()
  return {
    noteId: id,
    userId: user.id,
    ...rest
  }
}

exports.dbToModel = dbToModel
exports.pojoToModel = pojoToModel
exports.modelToDb = modelToDb
