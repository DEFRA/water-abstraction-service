const getNextId = require('./next-id.js');

class Condition {
  constructor() {
    this.id = getNextId();

    this.code = 'CES';
    this.subCode = 'FLOW';
    this.purpose = null;
    this.param1 = 'AUTHOR';
    this.param2 = 17.5;

  }

  setPurpose(purpose) {
    this.purpose = purpose;
    return this;
  }

  export() {
    return {
      ID : this.id,
      ACIN_CODE : this.code,
      ACIN_SUBCODE : this.subCode,
      AABP_ID : this.purpose.id,
      AIPU_ID : null,
      PARAM1 : this.param1,
      PARAM2 : this.param2,
      DISP_ORD : null,
      TEXT : 'Some additional text here',
      FGAC_REGION_CODE : 1,
      SOURCE_CODE : 'NALD',
      BATCH_RUN_DATE : '12/02/2018 20:02:11'
    };
  }

}

module.exports = Condition;
