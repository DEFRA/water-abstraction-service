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

const getLicenceJson = async (licenceNumber) => {
  try {
    var data = await getMain(licenceNumber);
    for (var licenceRow in data) {
      //  console.log('Licence ',licenceRow)
      //  console.log(data[licenceRow])
      var thisLicenceRow = data[licenceRow];
      thisLicenceRow.data = {};
      //  console.log('get purpose')
      thisLicenceRow.data.versions = await getVersions(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);

      for (var v in thisLicenceRow.data.versions) {
        thisLicenceRow.data.versions[v].parties = await getParties(thisLicenceRow.data.versions[v].ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE);
        for (var p in thisLicenceRow.data.versions[v].parties) {
          thisLicenceRow.data.versions[v].parties[p].contacts = await getPartyContacts(thisLicenceRow.data.versions[v].parties[p].ID, thisLicenceRow.FGAC_REGION_CODE);
        }
      }

      const currentVersion = await getCurrentVersion(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);

      if (currentVersion) {
        thisLicenceRow.data.current_version = {};
        thisLicenceRow.data.current_version.licence = currentVersion;

        thisLicenceRow.data.current_version.licence.party = await getParties(currentVersion.ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE);
        for (p in thisLicenceRow.data.current_version.licence.parties) {
          thisLicenceRow.data.current_version.licence.parties[p].contacts = await getPartyContacts(currentVersion.parties[p].ID, thisLicenceRow.FGAC_REGION_CODE);
        }
        thisLicenceRow.data.current_version.party = (await getParty(currentVersion.ACON_APAR_ID, thisLicenceRow.FGAC_REGION_CODE))[0];
        thisLicenceRow.data.current_version.address = (await getAddress(currentVersion.ACON_AADD_ID, thisLicenceRow.FGAC_REGION_CODE))[0];
        thisLicenceRow.data.current_version.original_effective_date = dateToSortableString(thisLicenceRow.ORIG_EFF_DATE);
        thisLicenceRow.data.current_version.version_effective_date = dateToSortableString(currentVersion.EFF_ST_DATE);
        thisLicenceRow.data.current_version.expiry_date = dateToSortableString(thisLicenceRow.EXPIRY_DATE);

        thisLicenceRow.data.current_version.purposes = await getPurposes(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE, currentVersion.ISSUE_NO, currentVersion.INCR_NO);
        for (var pu in thisLicenceRow.data.current_version.purposes) {
          thisLicenceRow.data.current_version.purposes[pu].purpose = await getPurpose({
            primary: thisLicenceRow.data.current_version.purposes[pu].APUR_APPR_CODE,
            secondary: thisLicenceRow.data.current_version.purposes[pu].APUR_APSE_CODE,
            tertiary: thisLicenceRow.data.current_version.purposes[pu].APUR_APUS_CODE
          });
          thisLicenceRow.data.current_version.purposes[pu].purposePoints = await getPurposePoints(thisLicenceRow.data.current_version.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
          thisLicenceRow.data.current_version.purposes[pu].licenceAgreements = await getPurposePointLicenceAgreements(thisLicenceRow.data.current_version.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
          thisLicenceRow.data.current_version.purposes[pu].licenceConditions = await getPurposePointLicenceConditions(thisLicenceRow.data.current_version.purposes[pu].ID, thisLicenceRow.FGAC_REGION_CODE);
        }
      } else {
        thisLicenceRow.data.current_version = null;
      }

      thisLicenceRow.data.cams = await getCams(thisLicenceRow.CAMS_CODE, thisLicenceRow.FGAC_REGION_CODE);
      //  console.log('get roles')
      thisLicenceRow.data.roles = await getRoles(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      //  console.log('get points')
      thisLicenceRow.data.purposes = await getPurposes(thisLicenceRow.ID, thisLicenceRow.FGAC_REGION_CODE);
      for (pu in thisLicenceRow.data.purposes) {
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
      //  console.log(JSON.stringify(thisLicenceRow))
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
