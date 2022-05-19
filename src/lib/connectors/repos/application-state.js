'use strict'

const { ApplicationState } = require('../bookshelf')
const mapModel = model => model ? model.toJSON() : null

const create = data =>
  ApplicationState
    .forge(data)
    .save()

const update = (applicationStateId, changes) =>
  ApplicationState
    .forge({ applicationStateId })
    .save(changes)

const findOneByKey = async key => {
  const model = await ApplicationState
    .forge({ key })
    .fetch()
  return mapModel(model)
}

exports.create = create
exports.update = update
exports.findOneByKey = findOneByKey
