'use strict'

const Model = require('./model')
const validators = require('./validators')

class Pagination extends Model {
  set page (page) {
    validators.assertPositiveInteger(page)
    this._page = page
  }

  get page () {
    return this._page
  }

  set perPage (perPage) {
    validators.assertPositiveInteger(perPage)
    this._perPage = perPage
  }

  get perPage () {
    return this._perPage
  }

  set totalRows (totalRows) {
    validators.assertPositiveOrZeroInteger(totalRows)
    this._totalRows = parseInt(totalRows)
    this._pageCount = Math.ceil(this._totalRows / this._perPage)
  }

  get totalRows () {
    return this._totalRows
  }

  set pageCount (pageCount) {
    validators.assertPositiveOrZeroInteger(pageCount)
    this._pageCount = pageCount
  }

  get pageCount () {
    return this._pageCount
  }

  /**
   * Gets the start index
   * @return {Number}
   */
  get startIndex () {
    return (this.page - 1) * this.perPage
  }
}

module.exports = Pagination
