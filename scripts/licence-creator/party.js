const moment = require('moment');
const getNextId = require('./next-id');

class Party {
  constructor () {
    this.id = getNextId();
    this.isOrg = false;
    this.name = 'Doe';
    this.foreName = 'John';
    this.initials = 'H';
    this.salutation = 'Mr';
    this.contacts = [];
  }

  addContact (contact) {
    this.contacts.push(contact);
    return this;
  }

  export () {
    return {
      ID: this.id,
      APAR_TYPE: this.isOrg ? 'ORG' : 'PER',
      NAME: this.name,
      SPOKEN_LANG: 'E',
      WRITTEN_LANG: 'E',
      LAST_CHANGED: moment().format('DD/MM/YYYY'),
      DISABLED: 'N',
      FORENAME: this.foreName,
      INITIALS: this.initials,
      SALUTATION: this.salutation,
      REF: null,
      DESCR: null,
      LOCAL_NAME: null,
      ASIC_ASID_DIVISION: null,
      ASIC_CLASS: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Party;
