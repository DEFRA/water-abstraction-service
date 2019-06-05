class Contact {
  constructor () {
    this.party = null;
    this.address = null;
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
      APAR_ID: this.party.id,
      AADD_ID: this.address.id,
      DISABLED: 'N',
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Contact;
