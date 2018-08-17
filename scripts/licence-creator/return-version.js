
class ReturnVersion {
  constructor () {
    this.startDate = '01/01/2018';
    this.formats = [];
    this.versionNumber = 100;
  }

  setLicence (licence) {
    this.licence = licence;
    return this;
  }

  addFormat (format) {
    format.setReturnVersion(this);
    this.formats.push(format);
    return this;
  }

  getVersionNumber () {
    return this.versionNumber;
  }

  export () {
    return {
      AABL_ID: this.licence.id,
      VERS_NO: this.versionNumber,
      EFF_ST_DATE: this.startDate,
      STATUS: 'CURR',
      FORM_LOGS_REQD: 'Y',
      EFF_END_DATE: null,
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = ReturnVersion;
