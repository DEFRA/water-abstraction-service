class Source {
  constructor () {
    this.code = 'GWSOS';
    this.name = 'GROUND WATER SOURCE OF SUPPLY';
    this.localName = 'GROUND WATER';
    this.sourceType = 'GW';
  }

  export () {
    return {
      CODE: this.code,
      NAME: this.name,
      LOCAL_NAME: this.localName,
      SOURCE_TYPE: this.sourceType,
      NGR_SHEET: 'TL',
      NGR_EAST: 12000,
      NGR_NORTH: 80000,
      CART_EAST: 470000,
      CART_NORTH: 310000,
      DISABLED: 'N',
      AQUIFER_CLASS: null,
      NOTES: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Source;
