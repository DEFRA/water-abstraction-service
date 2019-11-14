class RoleType {
  constructor () {
    this.code = 'LC';
    this.description = 'Licence contact';
    this.affectsAbs = true;
    this.affectsImp = true;
    this.isAgency = false;
  }

  export () {
    return {
      CODE: this.code,
      DESCR: this.description,
      AFFECTS_ABS: this.affectsAbs ? 'Y' : 'N',
      AFFECTS_IMP: this.affectsImp ? 'Y' : 'N',
      CUST_AGENCY: this.isAgency ? 'AGEN' : 'CUST',
      USED_BY_SYS: 'N',
      DISABLED: 'N',
      DISP_ORD: null,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = RoleType;
