'use-strict';

// the data definitions are defined at integration-tests/billing/services/data
const scenarios = [
  {
    licence: 'l1',
    chargeVersions: [{
      company: 'co1',
      invoiceAccount: 'ia1',
      chargeVersion: 'cv1',
      chargeElements: ['ce1']
    }]
  }
];

exports.scenarios = scenarios;
