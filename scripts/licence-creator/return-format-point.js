class ReturnFormatPoint {
  setFormat (format) {
    this.format = format;
    return this;
  }

  setPoint (point) {
    this.point = point;
    return this;
  }

  export () {
    return {
      ARTY_ID: this.format.id,
      AAIP_ID: this.point.id,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = ReturnFormatPoint;
