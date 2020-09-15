exports.l1 = {
  licenceRef : 'L1',
  includeInSupplementaryBilling : 'no',
  isWaterUndertaker : false,
  regions : {
    historicalAreaCode: 'ARCA',
    regionalChargeArea: 'Anglian'
  },
  startDate : '2008-04-01',
  expiredDate : null,
  lapsedDate : null,
  revokedDate : null,
  suspendFromBilling : false,
  documents : [{
    versionNumber : 1,
    status : 'current',
    startDate : '2008-04-01',
    endDate: null,
    roles: [{
      role: 'licenceHolder',
      startDate : '2008-04-01',
      endDate: null,
      company : 'co1',
      address : 'ad1',
      contact: 'c1'
    }]
  }]
};

exports.l2 = Object.assign({}, exports.l1, { includeInSupplementaryBilling: 'yes', licenceRef: 'L2' })
