const Model = require('./model');
const {
  assertPositiveOrZeroInteger,
  assertNegativeOrZeroInteger,
  assertInteger
} = require('./validators');

class Totals extends Model {
  /**
   * Number of credit notes
   * @param {Number} count
   */
  set creditNoteCount (count) {
    assertPositiveOrZeroInteger(count);
    this._creditNoteCount = count;
  }

  get creditNoteCount () {
    return this._creditNoteCount;
  }

  /**
   * Value of credit notes
   * @param {Number} value - in pence
   */
  set creditNoteValue (value) {
    assertNegativeOrZeroInteger(value);
    this._creditNoteValue = value;
  }

  get creditNoteValue () {
    return this._creditNoteValue;
  }

  /**
   * Number of invoices
   * @param {Number} count
   */
  set invoiceCount (count) {
    assertPositiveOrZeroInteger(count);
    this._invoiceCount = count;
  }

  get invoiceCount () {
    return this._invoiceCount;
  }

  /**
   * Value of invoices
   * @param {Number} value - in pence
   */
  set invoiceValue (value) {
    assertPositiveOrZeroInteger(value);
    this._invoiceValue = value;
  }

  get invoiceValue () {
    return this._invoiceValue;
  }

  /**
   * Number of credit lines
   * @param {Number} count
   */
  set creditLineCount (count) {
    assertPositiveOrZeroInteger(count);
    this._creditLineCount = count;
  }

  get creditLineCount () {
    return this._creditLineCount;
  }

  /**
   * Value of credit lines
   * @param {Number} value - in pence
   */
  set creditLineValue (value) {
    assertNegativeOrZeroInteger(value);
    this._creditLineValue = value;
  }

  get creditLineValue () {
    return this._creditLineValue;
  }

  /**
   * Number of debit lines
   * @param {Number} count
   */
  set debitLineCount (count) {
    assertPositiveOrZeroInteger(count);
    this._debitLineCount = count;
  }

  get debitLineCount () {
    return this._debitLineCount;
  }

  /**
   * Value of debit lines
   * @param {Number} value - in pence
   */
  set debitLineValue (value) {
    assertPositiveOrZeroInteger(value);
    this._debitLineValue = value;
  }

  get debitLineValue () {
    return this._debitLineValue;
  }

  /**
   * Net total
   * @param {Number} value - in pence
   */
  set netTotal (value) {
    assertInteger(value);
    this._netTotal = value;
  }

  get netTotal () {
    return this._netTotal;
  }
}

module.exports = Totals;
