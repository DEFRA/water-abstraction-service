/**
 * Contact numbers
 * @class
 */
class ContactNo {
  constructor () {
    this.party = null;
    this.address = null;
    this.contactNoType = null;
  }

  setContactNoType (contactNoType) {
    this.contactNoType = contactNoType;
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

  export () {
    return {
      ACON_APAR_ID: this.party.id,
      ACON_AADD_ID: this.address.id,
      ACNT_CODE: this.contactNoType.code,
      CONT_NO: '01234 567890',
      DISP_ORD: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = ContactNo;
