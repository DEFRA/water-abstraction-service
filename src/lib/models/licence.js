const Joi = require('@hapi/joi');
const VALID_GUID = Joi.string().guid().required();
const VALID_LICENCE_NUMBER = Joi.string().regex(/^[&()*-./0123456789ABCDEFGHLMNORSTWXYZ]+/).required();

class Licence {
  /**
   * Sets the ID for this invoice
   * @param {String} - GUID
   */
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  /**
   * Gets the ID for this invoice
   * @return {String}
   */
  get id () {
    return this._id;
  }

  /**
   * Sets the ID for this invoice
   * @param {String} - GUID
   */
  set licenceNumber (licenceNumber) {
    Joi.assert(licenceNumber, VALID_LICENCE_NUMBER);
    this._licenceNumber = licenceNumber;
  }

  /**
   * Gets the ID for this invoice
   * @return {String}
   */
  get licenceNumber () {
    return this._licenceNumber;
  }
}

module.exports = Licence;
