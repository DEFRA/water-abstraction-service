'use strict'

const Model = require('./model')

const {
  assertString,
  assertNullableId
} = require('./validators')

class GaugingStation extends Model {
  get hydrologyStationId () {
    return this._hydrologyStationId
  }

  set hydrologyStationId (hydrologyStationId) {
    assertNullableId(hydrologyStationId)
    this._hydrologyStationId = hydrologyStationId
  }

  get label () {
    return this._label
  }

  set label (label) {
    assertString(label)
    this._label = label
  }

  get lat () {
    return this._lat
  }

  set lat (lat) {
    this._lat = lat
  }

  get long () {
    return this._long
  }

  set long (long) {
    this._long = long
  }

  get easting () {
    return this._easting
  }

  set easting (easting) {
    this._easting = easting
  }

  get northing () {
    return this._northing
  }

  set northing (northing) {
    this._northing = northing
  }

  get gridReference () {
    return this._gridReference
  }

  set gridReference (gridReference) {
    this._gridReference = gridReference
  }

  get catchmentName () {
    return this._catchmentName
  }

  set catchmentName (catchmentName) {
    this._catchmentName = catchmentName
  }

  get riverName () {
    return this._riverName
  }

  set riverName (riverName) {
    this._riverName = riverName
  }

  get wiskiId () {
    return this._wiskiId
  }

  set wiskiId (wiskiId) {
    this._wiskiId = wiskiId
  }

  get wiskiIdstationReference () {
    return this._stationReference
  }

  get stationReference () {
    return this._stationReference
  }

  set stationReference (stationReference) {
    this._stationReference = stationReference
  }

  get dateCreated () {
    return this._dateCreated
  }

  set dateCreated (dateCreated) {
    this._dateCreated = this.getDateOrThrow(dateCreated, 'Date created')
  }

  get dateUpdated () {
    return this._dateUpdated
  }

  set dateUpdated (dateUpdated) {
    this._dateUpdated = this.getDateTimeFromValue(dateUpdated)
  }

  toJSON () {
    return {
      ...super.toJSON()
    }
  }
}

module.exports = GaugingStation
