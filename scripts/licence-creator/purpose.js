'use strict';

const getNextId = require('./next-id.js');

class Purpose {
  constructor () {
    this.id = getNextId();

    this.licence = null;

    this.primary = null;
    this.secondary = null;
    this.tertiary = null;

    this.periodStartDay = 1;
    this.periodStartMonth = 3;
    this.periodEndDay = 30;
    this.periodEndMonth = 9;

    this.annualQty = 105000;
    this.dailyQty = 15.2;
    this.hourlyQty = 3.5;
    this.instantQty = 0.15;

    this.conditions = [];
    this.agreements = [];
    this.purposePoints = [];
  }

  setLicence (licence) {
    this.licence = licence;
    return this;
  }

  setPrimaryPurpose (primaryPurpose) {
    this.primary = primaryPurpose;
    return this;
  }

  setSecondaryPurpose (secondaryPurpose) {
    this.secondary = secondaryPurpose;
    return this;
  }

  setTertiaryPurpose (tertiaryPurpose) {
    this.tertiary = tertiaryPurpose;
    return this;
  }

  addCondition (condition) {
    this.conditions.push(condition);
    condition.setPurpose(this);
    return this;
  }

  addAggreement (agreement) {
    this.agreements.push(agreement);
    agreement.setPurpose(this);
    return this;
  }

  addPurposePoint (purposePoint) {
    this.purposePoints.push(purposePoint);
    purposePoint.setPurpose(this);
    return this;
  }

  export () {
    return {
      ID: this.id,
      AABV_AABL_ID: this.licence.id,
      AABV_ISSUE_NO: 100,
      AABV_INCR_NO: 0,
      APUR_APPR_CODE: this.primary.code,
      APUR_APSE_CODE: this.secondary.code,
      APUR_APUS_CODE: this.tertiary.code,
      PERIOD_ST_DAY: this.periodStartDay,
      PERIOD_ST_MONTH: this.periodStartMonth,
      PERIOD_END_DAY: this.periodEndDay,
      PERIOD_END_MONTH: this.periodEndMonth,
      AMOM_CODE: 'PRT',
      ANNUAL_QTY: this.annualQty,
      ANNUAL_QTY_USABILITY: 'L',
      DAILY_QTY: this.dailyQty,
      DAILY_QTY_USABILITY: 'L',
      HOURLY_QTY: this.hourlyQty,
      HOURLY_QTY_USABILITY: 'L',
      INST_QTY: this.instantQty,
      INST_QTY_USABILITY: 'L',
      TIMELTD_START_DATE: null,
      LANDS: null,
      AREC_CODE: null,
      DISP_ORD: null,
      NOTES: 'Licence notes here, could include long NGR code SJ 1234 5678',
      FGAC_REGION_CODE: 1,
      SOURCE_CODE: 'NALD',
      BATCH_RUN_DATE: '12/02/2018 20:02:11'
    };
  }
}

module.exports = Purpose;
