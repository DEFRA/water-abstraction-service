class PurposeSecondary {

  constructor() {
    this.code = 'AGR';
    this.description = 'General Agriculture';
  }

  export() {
    return {
      CODE : this.code,
      DESCR : this.description,
      DISABLED : 'N',
      DISP_ORD : null,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:05:59'
    }
  }
}

module.exports = PurposeSecondary;
