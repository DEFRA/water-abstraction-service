'use strict'

class AsyncAdapter {
  constructor () {
    this._functions = new Map()
  }

  /**
   * Adds an async function responsible for creating and returning the model
   *
   * @param {String} modelName
   * @param {Function} asyncFunction
   * @return {this}
   */
  add (modelName, asyncFunction) {
    this._functions.set(modelName, asyncFunction)
    return this
  }

  /**
   * Creates a new entity from the supplied data
   *
   * @param {Object} entityConfig - loaded from YAML file
   * @param {Object} data - loaded from YAML file, with refs replaced
   * @return {Promise<Object>} - created entity
   */
  create ({ model: modelName }, data) {
    if (!this._functions.has(modelName)) {
      throw new Error(`No async function registered to load model ${modelName}`)
    }
    return this._functions.get(modelName)(data)
  }
}

module.exports = AsyncAdapter
