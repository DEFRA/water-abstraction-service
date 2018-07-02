const { dateToSortableString } = require('./nald-helpers.js');
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

    data.purposes = await getPurposes(licenceRow.ID, regionCode, currentVersion.ISSUE_NO, currentVersion.INCR_NO);
    for (let pu in data.purposes) {
      data.purposes[pu].purpose = await getPurpose({
        primary: data.purposes[pu].APUR_APPR_CODE,
        secondary: data.purposes[pu].APUR_APSE_CODE,
        tertiary: data.purposes[pu].APUR_APUS_CODE
      });
      data.purposes[pu].purposePoints = await getPurposePoints(data.purposes[pu].ID, regionCode);
      data.purposes[pu].licenceAgreements = await getPurposePointLicenceAgreements(data.purposes[pu].ID, regionCode);
      data.purposes[pu].licenceConditions = await getPurposePointLicenceConditions(data.purposes[pu].ID, regionCode);
    }

    return data;
  }

  return null;
};

const getLicenceJson = async (licenceNumber) => {
  try {
    var data = await getMain(licenceNumber);
    for (var licenceRow in data) {
      var thisLicenceRow = data[licenceRow];
      thisLicenceRow.data = {};
      thisLicenceRow.data.versions = await getVersions(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);

      for (var v in thisLicenceRow.data.versions) {
        thisLicenceRow.data.versions[v].parties = await getParties(thisLicenceRow.data.versions[v].ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE);
        for (var p in thisLicenceRow.data.versions[v].parties) {
          thisLicenceRow.data.versions[v].parties[p].contacts = await getPartyContacts(thisLicenceRow.data.versions[v].parties[p].ID, thisLicenceRow.FGAC_REGION_CODE);
        }
      }

      thisLicenceRow.data.current_version = await getCurrentVersionJson(thisLicenceRow);

      thisLicenceRow.data.cams = await getCams(thisLicenceRow.CAMS_CODE, thisLicenceRow.FGAC_REGION_CODE);
      thisLicenceRow.data.roles = await getRoles(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      thisLicenceRow.data.purposes = await getPurposes(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      for (let pu in thisLicenceRow.data.purposes) {
        thisLicenceRow.data.purposes[pu].purpose = await getPurpose({
          primary: thisLicenceRow.data.purposes[pu].APUR_APPR_CODE,
          secondary: thisLicenceRow.data.purposes[pu].APUR_APSE_CODE,
          tertiary: thisLicenceRow.data.purposes[pu].APUR_APUS_CODE
        });
        thisLicenceRow.data.purposes[pu].purpose = thisLicenceRow.data.purposes[pu].purpose[0];
        thisLicenceRow.data.purposes[pu].purposePoints = await getPurposePoints(thisLicenceRow.data.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        thisLicenceRow.data.purposes[pu].licenceAgreements = await getPurposePointLicenceAgreements(thisLicenceRow.data.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        thisLicenceRow.data.purposes[pu].licenceConditions = await getPurposePointLicenceConditions(thisLicenceRow.data.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
      }
      return thisLicenceRow;
    }
    // process.exit()
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  getLicenceJson
};
