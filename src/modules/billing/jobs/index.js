exports.createBillRun = {
  job: require('./create-bill-run'),
  onCompleteHandler: require('./create-bill-run-complete')
};

exports.populateBatchChargeVersions = {
  job: require('./populate-batch-charge-versions'),
  onCompleteHandler: require('./populate-batch-charge-versions-complete')
};

exports.processChargeVersion = {
  job: require('./process-charge-version'),
  onCompleteHandler: require('./process-charge-version-complete')
};

exports.prepareTransactions = {
  job: require('./prepare-transactions'),
  onCompleteHandler: require('./prepare-transactions-complete')
};

exports.createCharge = {
  job: require('./create-charge'),
  onCompleteHandler: require('./create-charge-complete')
};

exports.refreshTotals = {
  job: require('./refresh-totals')
};
