class ReturnFormatPurpose {
  setFormat (format) {
    this.format = format;
    return this;
  }

  export () {
    return {
      ARTY_ID: this.format.id,
      APUR_APPR_CODE: 'A',
      APUR_APSE_CODE: 'AGR',
      APUR_APUS_CODE: '400',
      PURP_ALIAS: 'Spray irrigation - direct',
      PURP_ALIAS_WELSH: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = ReturnFormatPurpose;
