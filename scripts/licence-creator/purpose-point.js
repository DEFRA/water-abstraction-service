class PurposePoint {
  constructor () {
    this.purpose = null;
    this.point = null;
    this.means = null;
  }

  setPurpose (purpose) {
    this.purpose = purpose;
    return this;
  }

  setPoint (point) {
    this.point = point;
    return this;
  }

  setMeansOfAbstraction (means) {
    this.means = means;
    return this;
  }

  export () {
    return {
      AABP_ID: this.purpose.id,
      AAIP_ID: this.point.id,
      AMOA_CODE: this.means.code,
      NOTES: 'Notes here',
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = PurposePoint;
