'use strict';

const { get } = require('lodash');
const urlJoin = require('url-join');
const moment = require('moment');

const helpers = require('@envage/water-abstraction-helpers');
const apiClientFactory = require('./api-client-factory');
const config = require('../../../config');
const { licence: { regimeId, typeId } } = config;

const factory = require('./service-version-factory');
const calendarToIso = helpers.nald.dates.calendarToIso;

const licences = apiClientFactory.create(`${config.services.permits}licence`);

const getLicenceNumbersFilter = licenceNumbers => ({
  licence_regime_id: regimeId,
  licence_type_id: typeId,
  licence_ref: {
    $in: licenceNumbers
  }
});

/**
 * Gets the NALD region codes for each licence number supplied, and returns a map
 * @param  {Array} licenceNumbers - licence numbers to check
 * @return {Promise}                resolves with map of licence numbers/regions
 */
const getLicenceRegionCodes = async (licenceNumbers) => {
  if (licenceNumbers.length === 0) {
    return {};
  }
  const filter = getLicenceNumbersFilter(licenceNumbers);
  const columns = ['licence_ref', 'licence_data_value->>FGAC_REGION_CODE'];
  const data = await licences.findAll(filter, null, columns);

  return data.reduce((acc, row) => {
    return {
      ...acc,
      [row.licence_ref]: parseInt(row['?column?'])
    };
  }, {});
};

const getLicenceEndDates = async licenceNumbers => {
  if (licenceNumbers.length === 0) {
    return {};
  }

  const filter = getLicenceNumbersFilter(licenceNumbers);
  const columns = ['licence_ref', 'licence_data_value'];
  const data = await licences.findAll(filter, null, columns);

  return data.reduce((acc, row) => {
    return {
      ...acc,
      [row.licence_ref]: {
        dateRevoked: calendarToIso(row.licence_data_value.REV_DATE),
        dateExpired: calendarToIso(row.licence_data_value.EXPIRY_DATE),
        dateLapsed: calendarToIso(row.licence_data_value.LAPSED_DATE)
      }
    };
  }, {});
};

/**
 * Loads the water licence from the permit repo with the specified licence
 * number
 * @param  {String}  licenceNumber
 * @return {Promise<Object>} - resolves with licence data
 */
licences.getWaterLicence = async (licenceNumber) => {
  const filter = {
    licence_ref: licenceNumber,
    licence_type_id: typeId,
    licence_regime_id: regimeId
  };
  const licenceResponse = await licences.findMany(filter);
  return get(licenceResponse, 'data[0]');
};

/**
 * Grabs all licences that are overdue for having their
 * licence_version_purpose_condition records copied from Digitise entries
 * @return {Promise<Array>}
 */
licences.getWaterLicencesThatHaveConditionsThatNeedToBeCopiedFromDigitise = () => {
  const filter = {
    licence_type_id: 10,
    $or: [
      {
        date_licence_version_purpose_conditions_last_copied: {
          $gte: moment().subtract(1, 'd')
        }
      },
      {
        date_licence_version_purpose_conditions_last_copied: null
      }
    ]
  };
  return licences.findAll(filter, null, ['licence_id', 'licence_ref', 'licence_data_value']);
};

/**
 * Grabs all licences that are overdue for having their
 * licence_gauging_stations records copied from Digitise entries
 * @return {Promise<Array>}
 */
licences.getWaterLicencesThatHaveGaugingStationLinkagesThatNeedToBeCopiedFromDigitise = () => {
  const filter = {
    licence_type_id: 10,
    $or: [
      {
        date_gauging_station_links_last_copied: {
          $gte: moment().subtract(3, 'd')
        }
      },
      {
        date_gauging_station_links_last_copied: null
      }
    ]
  };
  return licences.findAll(filter, null, ['licence_ref', 'licence_data_value']);
};

const deleteAcceptanceTestData = () => {
  const url = urlJoin(config.services.permits, 'acceptance-tests');
  return helpers.serviceRequest.delete(url);
};

exports.licences = licences;
exports.getLicenceRegionCodes = getLicenceRegionCodes;
exports.getLicenceEndDates = getLicenceEndDates;
exports.getServiceVersion = factory.create(config.services.permits);

if (config.isAcceptanceTestTarget) {
  exports.deleteAcceptanceTestData = deleteAcceptanceTestData;
}
