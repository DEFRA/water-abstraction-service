class MeansOfAbstraction {
  constructor (code, description) {
    this.code = code;
    this.description = description;
  }

  export () {
    return {
      CODE: this.code,
      DESCR: this.description,
      DISABLED: 'N',
      DISP_ORD: null,
      NOTES: null,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = MeansOfAbstraction;
