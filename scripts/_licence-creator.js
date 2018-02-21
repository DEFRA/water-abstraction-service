

const moment = require('moment');

let idCounter = 1000000000;


/**
 * NALD party class for building dummy licences
 * @class Party
 */
class Party {
  constructor(isOrg, name, foreName, initials, salutation) {

    idCounter++;

    this.party = {
      ID : idCounter,
      APAR_TYPE : isOrg ? 'ORG' : 'PER',
      NAME : name,
      SPOKEN_LANG : 'E',
      WRITTEN_LANG : 'E',
      LAST_CHANGED : moment().format('DD/MM/YYYY'),
      DISABLED : 'N',
      FORENAME : foreName,
      INITIALS : initials,
      SALUTATION : salutation,
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

  getId() {
    return this.party.ID;
  }
}


/**
 * NALD address class for building dummy licences
 * @class Address
 */
class Address {
  constructor() {
    idCounter++;

    this.address = {
      ID : idCounter,
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

  getId() {
    return this.address.ID;
  }
}

/**
 * NALD version class for building dummy licences
 * @class Version
 */
class Version {
  constructor(Licence, Party, Address) {
    this.version = {
      AABL_ID : Licence.getId(),
      ISSUE_NO : 100,
      INCR_NO : 0,
      AABV_TYPE : 'ISSUE',
      EFF_ST_DATE : moment().format('DD/MM/YYYY'),
      STATUS : 'CURR',
      RETURNS_REQ : 'Y',
      CHARGEABLE : 'Y',
      ASRC_CODE : 'SWSOS',
      ACON_APAR_ID : Party.getId(),
      ACON_AADD_ID : Address.getId(),
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

/**
 * NALD licence class for building dummy licences
 * @class Party
 */
class Licence {

  constructor(licenceNumber) {

    idCounter++;

    this.licence = {
      ID : idCounter,
      LIC_NO : licenceNumber,
      AREP_SUC_CODE : 'ARSUC',
      AREP_AREA_CODE : 'ARCA',
      SUSP_FROM_BILLING : 'N',
      AREP_LEAP_CODE : 'C4',
      EXPIRY_DATE : moment().add(1, 'year').format('DD/MM/YYYY'),
      ORIG_EFF_DATE : moment().format('DD/MM/YYYY'),
      ORIG_SIG_DATE : null,
      ORIG_APP_NO : null,
      ORIG_LIC_NO : null,
      NOTES : '',
      REV_DATE : null,
      LAPSED_DATE : null,
      SUSP_FROM_RETURNS : null,
      AREP_CAMS_CODE : 'ACC01',
      X_REG_IND : 'N',
      PREV_LIC_NO : null,
      FOLL_LIC_NO : null,
      AREP_EIUC_CODE : 'ANOTH',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };

    this.parties = [];
    this.addresses = [];
    this.versions = [];
    this.repUnit = new RepUnit();

    return this;
  }


  getId() {
    return this.licence.ID;
  }

  addParty() {
    const party = new Party(...arguments);
    this.parties.push(party);
    return party;
  }

  addAddress() {
    const address = new Address(...arguments);
    this.addresses.push(address);
    return address;
  }

  addVersion() {
    const version = new Version(...arguments);
    this.versions.push(version);
    return version;
  }

  setEffectiveDate(date) {
    this.licence.ORIG_EFF_DATE = date;
    return this;
  }

  setExpiryDate(date) {
    this.licence.EXPIRY_DATE = date;
    return this;
  }
};


const l = new Licence('TEST/12/34/56/78/R99');
const p = l.addParty(false, 'Smith', 'Bob', 'A', 'Mr');
const a = l.addAddress();
l.addVersion(l, p, a);


console.log(JSON.stringify(l, null, 2));
