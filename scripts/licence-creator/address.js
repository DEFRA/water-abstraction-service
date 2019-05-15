const getNextId = require('./next-id');

/**
 * NALD address class for building dummy licences
 * @class Address
 */
class Address {
  constructor () {
    this.id = getNextId();
  }

  export () {
    return {
      ID: this.id,
      ADDR_LINE_1: 'Daisy cow farm',
      LAST_CHANGED: '01/01/2018 09:00:00',
      DISABLED: 'N',
      ADDR_LINE_2: 'Long road',
      ADDR_LINE_3: null,
      ADDR_LINE_4: null,
      TOWN: 'Daisybury',
      COUNTY: 'Testingshire',
      POSTCODE: 'TT1 1TT',
      COUNTRY: null,
      APCO_CODE: 'TEST',
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Address;
