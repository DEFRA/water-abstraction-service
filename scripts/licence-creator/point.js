const getNextId = require('./next-id.js');

class Point {
  constructor () {
    this.id = getNextId();
    this.source = null;
  }

  setSource (source) {
    this.source = source;
  }

  export () {
    return {
      ID: this.id,
      NGR1_SHEET: 'SP',
      NGR1_EAST: 123,
      NGR1_NORTH: 456,
      CART1_EAST: 400000,
      CART1_NORTH: 240000,
      LOCAL_NAME: 'TEST BOREHOLE',
      ASRC_CODE: this.source.code,
      DISABLED: 'N',
      LOCAL_NAME_WELSH: null,
      NGR2_SHEET: null,
      NGR2_EAST: null,
      NGR2_NORTH: null,
      CART2_EAST: null,
      CART2_NORTH: null,
      NGR3_SHEET: null,
      NGR3_EAST: null,
      NRR3_NORTH: null,
      CART3_EAST: null,
      CART3_NORTH: null,
      NGR4_SHEET: null,
      NGR4_EAST: null,
      NGR4_NORTH: null,
      CART4_EAST: null,
      CART4_NORTH: null,
      AAPC_CODE: 'SP',
      AAPT_APTP_CODE: 'G',
      AAPT_APTS_CODE: 'BH',
      ABAN_CODE: null,
      LOCATION_TEXT: null,
      AADD_ID: null,
      DEPTH: null,
      WRB_NO: null,
      BGS_NO: null,
      REG_WELL_INDEX_REF: null,
      HYDRO_REF: null,
      HYDRO_INTERCEPT_DIST: null,
      HYDRO_GW_OFFSET_DIST: null,
      NOTES: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Point;
