'use strict'

class BookshelfAdapter {
  constructor (bookshelf) {
    this._bookshelf = bookshelf
  }

  /**
   * Creates a new entity from the supplied data
   *
   * @param {Object} entityConfig - loaded from YAML file
   * @param {Object} data - loaded from YAML file, with refs replaced
   * @return {Promise<Object>} - created entity
   */
  async create ({ model: modelName, constraints, ref }, data) {
    // Attempt insert
    try {
      let timeStamps
      // Allow date_created to be overridden if set
      if (data.dateCreated) {
        timeStamps = { date_created: new Date(data.dateCreated) }
      }
      const model = await this._bookshelf
        .model(modelName)
        .forge(data)
        .save(timeStamps)

      return model.toJSON()
    } catch (err) {
      // Handle unique constraint violation allowing previously inserted models
      // to be referenced
      if (err.code === '23505' && (err.constraint in constraints) && ref) {
        const model = await this._bookshelf
          .model(modelName)
          .forge(this._pick(data, constraints[err.constraint]))
          .fetch()

        return model.toJSON()
      } else {
        throw err
      }
    }
  }

  _pick (obj, props) {
    const picked = {}
    for (const prop of props) {
      if (obj[prop] !== undefined) {
        picked[prop] = obj[prop]
      }
    }
    return picked
  }
}

module.exports = BookshelfAdapter
