
class ConditionType {
  constructor () {
    this.code = 'CES';
    this.subCode = 'FLOW';
    this.description = 'Cessation Condition';
    this.subCodeDescription = 'Flow';
  }

  export () {
    return {
      CODE: this.code,
      SUBCODE: this.subCode,
      DESCR: this.description,
      AFFECTS_ABS: 'Y',
      AFFECTS_IMP: 'Y',
      DISABLED: 'N',
      DISP_ORD: null,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = ConditionType;
