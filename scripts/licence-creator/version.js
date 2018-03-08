const moment = require('moment');
const getNextId = require('./next-id.js');

class Version {
  constructor() {
    this.id = getNextId();
    this.startDate = moment().format('DD/MM/YYYY');

    this.licence = null;
    this.party = null;
    this.purposes = [];

    this.waLicenceType = null;
  }

  setLicence(licence) {
    this.licence = licence;
    return this;
  }

  setWALicenceType(waLicenceType) {
    this.waLicenceType = waLicenceType;
    return this;
  }

  setParty(party) {
    this.party = party;
    return this;
  }

  setAddress(address) {
    this.addressId = address.id;
    return this;
  }

  addPurpose(purpose) {
    this.purposes.push(purpose);
    purpose.setVersion(this);
    return this;
  }

  export() {
    return {
      AABL_ID : this.licence.id,
      ISSUE_NO : 100,
      INCR_NO : 0,
      AABV_TYPE : 'ISSUE',
      EFF_ST_DATE : this.startDate,
      STATUS : 'CURR',
      RETURNS_REQ : 'Y',
      CHARGEABLE : 'Y',
      ASRC_CODE : 'SWSOS',
      ACON_APAR_ID : this.party.id,
      ACON_AADD_ID : this.addressId,
      ALTY_CODE : 'LOR',
      ACCL_CODE : 'CR',
      MULTIPLE_LH : 'N',
      LIC_SIG_DATE : null,
      APP_NO : null,
      LIC_DOC_FLAG : null,
      EFF_END_DATE : null,
      EXPIRY_DATE1 : null,
      WA_ALTY_CODE : this.waLicenceType.code,
      VOL_CONV : 'N',
      WRT_CODE : 'N',
      DEREG_CODE : 'CONF',
      FGAC_REGION_CODE : 1
    }
  }
}

module.exports = Version;
