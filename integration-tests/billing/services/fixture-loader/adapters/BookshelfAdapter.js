'use strict';

const { pick } = require('lodash');

class BookshelfAdapter {
  constructor (bookshelf) {
    this._bookshelf = bookshelf;
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
      const model = await this._bookshelf
        .model(modelName)
        .forge(data)
        .save();

      return model.toJSON();
    } catch (err) {
      console.error(err);

      // Handle unique constraint violation allowing previously inserted models
      // to be referenced
      if (err.code === '23505' && (err.constraint in constraints) && ref) {
        const model = await this._bookshelf
          .model(modelName)
          .forge(pick(data, constraints[err.constraint]))
          .fetch();

        return model.toJSON();
      } else {
        throw err;
      }
    }
  }
}

module.exports = BookshelfAdapter;
