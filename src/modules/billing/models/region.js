const Joi = require('@hapi/joi');
const VALID_GUID = Joi.string().guid().required();

class Region {
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  get id () {
    return this._id;
  }
}

module.exports = Region;
