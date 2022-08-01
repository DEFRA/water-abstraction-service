const Model = require('./model')
const {
  assertNullablePositiveOrZeroInteger,
  assertNullableNegativeOrZeroInteger,
  assertNullableInteger
} = require('./validators')

class Totals extends Model {
  constructor (id) {
    super(id)
    this.creditNoteCount = null
    this.creditNoteValue = null
    this.invoiceCount = null
    this.invoiceValue = null
    this.netTotal = null
  }

  /**
   * Number of credit notes
   * @param {Number} count
   */
  set creditNoteCount (count) {
    assertNullablePositiveOrZeroInteger(count)
    this._creditNoteCount = count
  }

  get creditNoteCount () {
    return this._creditNoteCount
  }

  /**
   * Value of credit notes
   * @param {Number} value - in pence
   */
  set creditNoteValue (value) {
    assertNullableNegativeOrZeroInteger(value)
    this._creditNoteValue = value
  }

  get creditNoteValue () {
    return this._creditNoteValue
  }

  /**
   * Number of invoices
   * @param {Number} count
   */
  set invoiceCount (count) {
    assertNullablePositiveOrZeroInteger(count)
    this._invoiceCount = count
  }

  get invoiceCount () {
    return this._invoiceCount
  }

  /**
   * Value of invoices
   * @param {Number} value - in pence
   */
  set invoiceValue (value) {
    assertNullablePositiveOrZeroInteger(value)
    this._invoiceValue = value
  }

  get invoiceValue () {
    return this._invoiceValue
  }

  /**
   * Net total
   * @param {Number} value - in pence
   */
  set netTotal (value) {
    assertNullableInteger(value)
    this._netTotal = value
  }

  get netTotal () {
    return this._netTotal
  }
}

module.exports = Totals
