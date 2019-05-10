const moment = require('moment');
const getNextId = require('./next-id.js');

class Role {
  constructor () {
    this.id = getNextId();

    this.licence = null;
    this.party = null;
    this.address = null;

    this.startDate = moment().format('DD/MM/YYYY');
    this.endDate = moment().add(1, 'year').format('DD/MM/YYYY');

    this.contactNos = [];

    this.roleType = null;
  }

  setRoleType (roleType) {
    this.roleType = roleType;
    return this;
  }

  setLicence (licence) {
    this.licence = licence;
    return this;
  }

  setParty (party) {
    this.party = party;
    return this;
  }

  setAddress (address) {
    this.address = address;
    return this;
  }

  addContactNo (contactNo) {
    this.contactNos.push(contactNo);
    return this;
  }

  export () {
    return {
      ID: this.id,
      ALRT_CODE: this.roleType.code,
      ACON_APAR_ID: this.party.id,
      ACON_AADD_ID: this.address.id,
      EFF_ST_DATE: this.startDate,
      AABL_ID: this.licence.id,
      AIMP_ID: null,
      EFF_END_DATE: this.endDate,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Role;
