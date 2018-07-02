const { dateToSortableString } = require('./date-helpers.js');
const {
  getMain,
  getCams,
  getCurrentVersion,
  getVersions,
  getParties,
  getPartyContacts,
  getParty,
  getAddress,
  getRoles,
  getPurposes,
  getPurposePoints,
  getPurpose,
  getPurposePointLicenceAgreements,
  getPurposePointLicenceConditions
} = require('./nald-queries.js');

/**
 * Gets the purposes together with their points, agreements and conditions
 * for the specified current version
 * @param {Object} licenceRow
 * @param {Object} [currentVersion] - optional current version
 * @return {Promise}
 */
const getPurposesJson = async (licenceRow, currentVersion = null) => {
  const regionCode = licenceRow.FGAC_REGION_CODE;
  let purposes;
  if (currentVersion) {
    purposes = await getPurposes(licenceRow.ID, regionCode, currentVersion.ISSUE_NO, currentVersion.INCR_NO);
  } else {
    purposes = await getPurposes(licenceRow.ID, regionCode);
  }

  for (let purpose of purposes) {
    purpose.purpose = await getPurpose({
      primary: purpose.APUR_APPR_CODE,
      secondary: purpose.APUR_APSE_CODE,
      tertiary: purpose.APUR_APUS_CODE
    });
    purpose.purposePoints = await getPurposePoints(purpose.ID, regionCode);
    purpose.licenceAgreements = await getPurposePointLicenceAgreements(purpose.ID, regionCode);
    purpose.licenceConditions = await getPurposePointLicenceConditions(purpose.ID, regionCode);
  }
  return purposes;
};

/**
 * Gets the JSON for the current version of the licence (if available)
 * @param {Object} licenceRow
 * return {Promise} resolves with object of current version, or null
 */
const getCurrentVersionJson = async (licenceRow) => {
  console.log(`Getting current version`, licenceRow);

  const regionCode = licenceRow.FGAC_REGION_CODE;
  const currentVersion = await getCurrentVersion(licenceRow.ID, regionCode);

  if (currentVersion) {
    let data = {};
    data.licence = currentVersion;

    data.licence.party = await getParties(currentVersion.ACON_APAR_ID, regionCode);
    for (let p in data.licence.parties) {
      data.licence.parties[p].contacts = await getPartyContacts(currentVersion.parties[p].ID, regionCode);
    }
    data.party = (await getParty(currentVersion.ACON_APAR_ID, regionCode))[0];
    data.address = (await getAddress(currentVersion.ACON_AADD_ID, regionCode))[0];
    data.original_effective_date = dateToSortableString(licenceRow.ORIG_EFF_DATE);
    data.version_effective_date = dateToSortableString(currentVersion.EFF_ST_DATE);
    data.expiry_date = dateToSortableString(licenceRow.EXPIRY_DATE);

    data.purposes = await getPurposesJson(licenceRow, currentVersion);

    return data;
  }

  return null;
};

/**
 * Gets all licence versions (including current)
 * @param {Object} licenceRow
 * @return {Promise} resolves with versions array
 */
const getVersionsJson = async (licenceRow) => {
  let versions = await getVersions(licenceRow.ID, licenceRow.FGAC_REGION_CODE);

  for (let version of versions) {
    version.parties = await getParties(version.ACON_APAR_ID, licenceRow.FGAC_REGION_CODE);
    for (let party of version.parties) {
      party.contacts = await getPartyContacts(party.ID, licenceRow.FGAC_REGION_CODE);
    }
  }
  return versions;
};

/**
 * Build full licence JSON for storing in permit repo from NALD import tables
 * @param {String} licenceNumber
 * @return {Promise} resolves with permit repo JSON packet
 */
const getLicenceJson = async (licenceNumber) => {
  try {
    var data = await getMain(licenceNumber);
    for (var licenceRow in data) {
      var thisLicenceRow = data[licenceRow];
      thisLicenceRow.data = {};
      thisLicenceRow.data.versions = await getVersionsJson(thisLicenceRow);
      thisLicenceRow.data.current_version = await getCurrentVersionJson(thisLicenceRow);
      thisLicenceRow.data.cams = await getCams(thisLicenceRow.CAMS_CODE, thisLicenceRow.FGAC_REGION_CODE);
      thisLicenceRow.data.roles = await getRoles(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      thisLicenceRow.data.purposes = await getPurposesJson(thisLicenceRow);
      return thisLicenceRow;
    }
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  getLicenceJson
};
