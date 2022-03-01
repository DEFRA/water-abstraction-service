'use strict';

const Model = require('./model');
const validators = require('./validators');
const TYPES = {
  chargeVersion: 'charge_version'
};

class Note extends Model {
  constructor (...args) {
    super(...args);
    this._type = TYPES.chargeVersion;
  }

  get noteId () { return this._noteId; }

  set noteId (noteId) {
    validators.assertId(noteId);
    this._noteId = noteId;
  }

  get text () { return this._text; }

  set text (text) {
    validators.assertString(text);
    this._text = text;
  }

  get typeId () { return this._typeId; }

  set typeId (typeId) {
    validators.assertId(typeId);
    this._typeId = typeId;
  }

  get type () { return this._type; }

  set type (type) {
    validators.assertString(type);
    this._type = type;
  }

  get licenceId () { return this._licenceId; }

  set licenceId (licenceId) {
    validators.assertNullableId(licenceId);
    this._licenceId = licenceId;
  }

  get userId () { return this._userId; }

  set userId (userId) {
    validators.assertInteger(userId);
    this._userId = userId;
  }
}

module.exports.TYPES = TYPES;
module.exports = Note;
