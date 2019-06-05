const getNextId = require('./next-id.js');

class Agreement {
  constructor () {
    this.id = getNextId();
    this.startDate = '01/01/2018';
    this.endDate = '01/01/2020';
    this.purpose = null;
  }

  setPurpose (purpose) {
    this.purpose = purpose;
    return this;
  }

  export () {
    return {
      ID: this.id,
      ALSA_CODE: 'S127',
      EFF_ST_DATE: this.startDate,
      AABP_ID: this.purpose.id,
      AIPU_ID: null,
      EFF_END_DATE: null,
      TEXT: '',
      SIGNED_DATE: null,
      FILE_REF: null,
      DISP_ORD: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Agreement;
