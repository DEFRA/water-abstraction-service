const moment = require('moment');
let idCounter = 1000000000;

function getNextId() {
  idCounter++;
  return idCounter;
}



class Contact {
  constructor() {
    this.party = null;
    this.address = null;
  }

  setParty(party) {
    this.party = party;
    return this;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  export() {
    return {
      APAR_ID : this.party.id,
      AADD_ID : this.address.id,
      DISABLED : 'N',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  }
}

class Party {
  constructor() {
    this.id = getNextId();
    this.isOrg = false;
    this.name = 'Doe';
    this.foreName = 'John';
    this.initials = 'H';
    this.salutation = 'Mr';

    this.contacts = [];
  }

  addContact(contact) {
    this.contacts.push(contact);
    return this;
  }

  export() {
    return {
      ID : this.id,
      APAR_TYPE : this.isOrg ? 'ORG' : 'PER',
      NAME : this.name,
      SPOKEN_LANG : 'E',
      WRITTEN_LANG : 'E',
      LAST_CHANGED : moment().format('DD/MM/YYYY'),
      DISABLED : 'N',
      FORENAME : this.foreName,
      INITIALS : this.initials,
      SALUTATION : this.salutation,
      REF : null,
      DESCR : null,
      LOCAL_NAME : null,
      ASIC_ASID_DIVISION : null,
      ASIC_CLASS : null,
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    }
  }
}

/**
 * NALD address class for building dummy licences
 * @class Address
 */
class Address {
  constructor() {
    this.id = getNextId();
  }

  export() {
    return {
      ID : this.id,
      ADDR_LINE_1 : 'Daisy cow farm',
      LAST_CHANGED : moment().format('DD/MM/YYYY HH:mm:ss'),
      DISABLED : 'N',
      ADDR_LINE_2 : 'Long road',
      ADDR_LINE_3 : null,
      ADDR_LINE_4 : null,
      TOWN : 'Daisybury',
      COUNTY : 'Testingshire',
      POSTCODE : 'TT1 1TT',
      COUNTRY : null,
      APCO_CODE : 'TEST',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    }
  }
}


class Version {
  constructor() {
    this.id = getNextId();
    this.startDate = moment().format('DD/MM/YYYY');

    this.licence = null;
    this.party = null;
    this.purposes = [];
  }

  setLicence(licence) {
    this.licence = licence;
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
      WA_ALTY_CODE : 'NA',
      VOL_CONV : 'N',
      WRT_CODE : 'N',
      DEREG_CODE : 'CONF',
      FGAC_REGION_CODE : 1
    }
  }
}



class RepUnit {
  constructor() {
    this.code = 100;
    this.name = 'PARISH OF TESTINGSHIRE (ESSEX)';
  }

  export() {
    return {
      CODE : this.code,
      NAME : this.name,
      NGR_SHEET : 'TM',
      NGR_EAST : 18000,
      NGR_NORTH : 15000,
      CART_EAST : 550000,
      CART_NORTH : 290000,
      ARUT_CODE : 'OTHER',
      DISABLED : 'N',
      AREP_CODE : '04',
      ACON_AADD_ID : null,
      ACON_APAR_ID : null,
      NOTES : null,
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    }
  }
}

/**
 * Contact numbers
 * @class
 */
class ContactNo {
  constructor() {
    this.party = null;
    this.address = null;
  }

  setParty(party) {
    this.party = party;
    return this;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  export() {
    return {
      ACON_APAR_ID : this.party.id,
      ACON_AADD_ID : this.address.id,
      ACNT_CODE : 'HP',
      CONT_NO : '01234 567890',
      DISP_ORD : null,
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  }
}

class Role {
  constructor() {
    this.id = getNextId();

    this.licence = null;
    this.party = null;
    this.address = null;

    this.startDate = moment().format('DD/MM/YYYY');
    this.endDate = moment().add(1, 'year').format('DD/MM/YYYY');

    this.contactNos = [];
  }

  setLicence(licence) {
    this.licence = licence;
    return this;
  }

  setParty(party) {
    this.party = party;
    return this;
  }

  setAddress(address) {
    this.address = address;
    return this;
  }

  addContactNo(contactNo) {
    this.contactNos.push(contactNo);
    return this;
  }

  export() {
    return {
      ID : this.id,
      ALRT_CODE : 'RT',
      ACON_APAR_ID : this.party.id,
      ACON_AADD_ID : this.address.id,
      EFF_ST_DATE : this.startDate,
      AABL_ID : this.licence.id,
      AIMP_ID : null,
      EFF_END_DATE : this.endDate,
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  }

}



class Purpose {
  constructor() {
    this.id = getNextId();
    this.version = null;

    this.primary = 'A';
    this.secondary = 'AGR';
    this.tertiary =  140;

    this.periodStartDay = 1;
    this.periodStartMonth = 3;
    this.periodEndDay = 30;
    this.periodEndMonth = 9;

    this.annualQty = 105000;
    this.dailyQty = 15.2;
    this.hourlyQty = 3.5;
    this.instantQty = 0.15;

    this.conditions = [];
  }

  setVersion(version) {
    this.version = version;
    return this;
  }

  addCondition(condition) {
    this.conditions.push(condition);
    condition.setPurpose(this);
    return this;
  }

  export() {
    return {
      ID : this.id,
      AABV_AABL_ID : this.version.id,
      AABV_ISSUE_NO : 100,
      AABV_INCR_NO : 0,
      APUR_APPR_CODE : this.primary,
      APUR_APSE_CODE : this.secondary,
      APUR_APUS_CODE : this.tertiary,
      PERIOD_ST_DAY : this.periodStartDay,
      PERIOD_ST_MONTH : this.periodStartMonth,
      PERIOD_END_DAY : this.periodEndDay,
      PERIOD_END_MONTH : this.periodEndMonth,
      AMOM_CODE : 'PRT',
      ANNUAL_QTY : this.annualQty,
      ANNUAL_QTY_USABILITY : 'L',
      DAILY_QTY : this.dailyQty,
      DAILY_QTY_USABILITY : 'L',
      HOURLY_QTY : this.hourlyQty,
      HOURLY_QTY_USABILITY : 'L',
      INST_QTY : this.instantQty,
      INST_QTY_USABILITY : 'L',
      TIMELTD_START_DATE : null,
      LANDS : null,
      AREC_CODE : null,
      DISP_ORD : null,
      NOTES : 'Licence notes here, could include long NGR code SJ 1234 5678',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  }
}


class Condition {
  constructor() {
    this.id = getNextId();

    this.code = 'CES';
    this.subCode = 'FLOW';
    this.purpose = null;
    this.param1 = 'AUTHOR';
    this.param2 = 17.5;

  }

  setPurpose(purpose) {
    this.purpose = purpose;
    return this;
  }

  export() {
    return {
      ID : this.id,
      ACIN_CODE : this.code,
      ACIN_SUBCODE : this.subCode,
      AABP_ID : this.purpose.id,
      AIPU_ID : null,
      PARAM1 : this.param1,
      PARAM2 : this.param2,
      DISP_ORD : null,
      TEXT : 'Some additional text here',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  }

}


/**
 * NALD licence class for building dummy licences
 * @class Party
 */
class Licence {

  constructor(licenceNumber) {

    this.id = getNextId();
    this.licenceNumber = licenceNumber;
    this.startDate = moment().format('DD/MM/YYYY');
    this.expiryDate = moment().add(1, 'year').format('DD/MM/YYYY');

    this.versions = [];
    this.repUnit = new RepUnit();
    this.roles = [];
  }

  addVersion() {
    const version = new Version();
    version.setLicence(this);
    this.versions.push(version);

    // Add party to version
    const party = new Party();
    version.setParty(party);

    // Add contact to party
    const contact = new Contact();
    contact.setParty(party);
    party.addContact(contact);

    // Add address to contact
    const address = new Address();
    contact.setAddress(address);

    // Add role
    const role = new Role();
    this.roles.push(role);
    role.setLicence(this);
    role.setParty(party);
    role.setAddress(address);

    // Add contact no to role
    const contactNo = new ContactNo();
    contactNo.setParty(party);
    contactNo.setAddress(address);
    role.addContactNo(contactNo);

    // Add purpose
    const purpose = new Purpose();
    version.addPurpose(purpose);

    // Add condition
    const cond1 = new Condition();
    purpose.addCondition(cond1);


    return version;
  }


  exportAll() {

    const NALD_ABS_LIC_VERSIONS = this.versions.map(version => version.export());

    // Parties
    const NALD_PARTIES = this.versions.map(version => version.party.export());

    // Contacts
    const NALD_CONTACTS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.party.contacts.map(contact => contact.export())];
    }, []);

    // Addresses
    const NALD_ADDRESSES = this.versions.reduce((memo, version) => {
      memo = [...memo, ...version.party.contacts.map(contact => contact.address.export())];
      return memo;
    }, []);

    // Rep unit
    const NALD_REP_UNITS = [this.repUnit.export()];

    // Roles
    const NALD_LIC_ROLES = this.roles.map(role => role.export());

    // Contact Nos
    const NALD_CONT_NOS = this.roles.reduce((memo, role) => {
      return [...memo, ...role.contactNos.map(contactNo => contactNo.export())];
    }, []);

    // Purposes
    const NALD_ABS_LIC_PURPOSES = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.map(purpose => purpose.export())]
    }, []);

    // Conditions
    const NALD_LIC_CONDITIONS = this.versions.reduce((memo, version) => {
      return [...memo, ...version.purposes.reduce((memo2, purpose) => {
          return purpose.conditions.map(condition => condition.export());
      }, [])];
    }, []);

    return {
      NALD_ABS_LICENCES : [this.export()],
      NALD_ABS_LIC_VERSIONS,
      NALD_PARTIES,
      NALD_CONTACTS,
      NALD_ADDRESSES,
      NALD_REP_UNITS,
      NALD_LIC_ROLES,
      NALD_CONT_NOS,
      NALD_ABS_LIC_PURPOSES,
      NALD_LIC_CONDITIONS
    };
  }



  /**
   * Get data in NALD format
   */
  export() {
    return {
      ID : this.id,
      LIC_NO : this.licenceNumber,
      AREP_SUC_CODE : 'ARSUC',
      AREP_AREA_CODE : 'ARCA',
      SUSP_FROM_BILLING : 'N',
      AREP_LEAP_CODE : 'C4',
      EXPIRY_DATE : this.expiryDate,
      ORIG_EFF_DATE : this.startDate,
      ORIG_SIG_DATE : null,
      ORIG_APP_NO : null,
      ORIG_LIC_NO : null,
      NOTES : '',
      REV_DATE : null,
      LAPSED_DATE : null,
      SUSP_FROM_RETURNS : null,
      AREP_CAMS_CODE : this.repUnit.code,
      X_REG_IND : 'N',
      PREV_LIC_NO : null,
      FOLL_LIC_NO : null,
      AREP_EIUC_CODE : 'ANOTH',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  };
}


const l = new Licence('12/34/56/78');
l.addVersion();

console.log(l);
console.log(l.exportAll());
