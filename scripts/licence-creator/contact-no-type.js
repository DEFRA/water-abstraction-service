class ContactNotype {
  constructor () {
    this.code = 'WP';
    this.description = 'Work Phone';
  }

  export () {
    return {
      CODE: this.code,
      DESCR: this.description,
      DISABLED: 'N',
      DISP_ORD: null,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:32'
    };
  }
}

module.exports = ContactNotype;
