
class RepUnit {
  constructor () {
    this.code = 100;
    this.name = 'PARISH OF TESTINGSHIRE (ESSEX)';
  }

  export () {
    return {
      CODE: this.code,
      NAME: this.name,
      NGR_SHEET: 'TM',
      NGR_EAST: 18000,
      NGR_NORTH: 15000,
      CART_EAST: 550000,
      CART_NORTH: 290000,
      ARUT_CODE: 'OTHER',
      DISABLED: 'N',
      AREP_CODE: '04',
      ACON_AADD_ID: null,
      ACON_APAR_ID: null,
      NOTES: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = RepUnit;
