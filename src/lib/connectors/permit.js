const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const { APIClient } = require('@envage/hapi-pg-rest-api');
const config = require('../../../config');
const { licence: { regimeId, typeId } } = config;

const licences = new APIClient(rp, {
  endpoint: `${process.env.PERMIT_URI}licence`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const expiringLicences = new APIClient(rp, {
  endpoint: `${process.env.PERMIT_URI}expiring_licences?filter={licence_type_id:${config.licence.typeId},licence_regime_id:${config.licence.regimeId}}`,
  headers: {
    Authorization: process.env.JWT_TOKEN
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
  const filter = {
    licence_regime_id: regimeId,
    licence_type_id: typeId,
    licence_ref: {
      $in: licenceNumbers
    }
  };
  const columns = ['licence_ref', 'licence_data_value->>FGAC_REGION_CODE'];
  const data = await licences.findAll(filter, null, columns);

  return data.reduce((acc, row) => {
    return {
      ...acc,
      [row.licence_ref]: parseInt(row['?column?'])
    };
  }, {});
};

exports.licences = licences;
exports.expiringLicences = expiringLicences;
exports.getLicenceRegionCodes = getLicenceRegionCodes;
