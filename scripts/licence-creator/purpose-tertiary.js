class PurposeTertiary {
  constructor () {
    this.code = '140';
    this.description = 'General Farming & Domestic';
  }

  export () {
    return {
      CODE: this.code,
      DESCR: this.description,
      DISABLED: 'N',
      ALSF_CODE: 'M',
      DISP_ORD: null,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:05:59'
    };
  }
}

module.exports = PurposeTertiary;
