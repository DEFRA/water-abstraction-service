'use-strict';

// the data definitions are defined at integration-tests/billing/services/data
const scenarios = {
  AB1: {
    licence: 'l1',
    chargeVersions: [{
      company: 'co1',
      invoiceAccount: 'ia1',
      chargeVersion: 'cv1',
      chargeElements: ['ce1']
    }]
  },
  SB1: {
    annual: {
      licence: 'l2',
      chargeVersions: [{
        company: 'co1',
        invoiceAccount: 'ia1',
        chargeVersion: 'cv3',
        chargeElements: ['ce3'] // billable quantity = 25
      }]
    },
    supplementary: {
      licence: 'l2',
      chargeVersions: [{
        company: 'co1',
        invoiceAccount: 'ia1',
        chargeVersion: 'cv3',
        chargeElements: ['ce4'] // billable quantity = 50
      }]
    }
  }
};
exports.scenarios = scenarios;
