module.exports = [
  ...Object.values(require('./notifications/routes')),
  ...Object.values(require('./notify/routes')),
  ...Object.values(require('./river-levels/routes')),
  ...Object.values(require('./import/routes')),
  ...Object.values(require('./returns/routes')),
  ...Object.values(require('./pdf-notifications/routes')),
  ...Object.values(require('./returns-notifications/routes')),
  ...Object.values(require('./ar-analysis/routes')),
  ...Object.values(require('./licences/routes')),
  ...Object.values(require('./internal-search/routes')),
  ...Object.values(require('./users/routes')),
  ...Object.values(require('./communications/routes')),
  ...Object.values(require('./batch-notifications/routes')),
  ...Object.values(require('./companies/routes')),
  ...Object.values(require('./service-status/routes')),
  ...Object.values(require('./change-email/routes')),
  ...Object.values(require('./charge-versions/routes')),
  ...Object.values(require('./unlink-licence/routes')),
  ...Object.values(require('./acceptance-tests/routes')),
  ...Object.values(require('./regions/routes')),
  ...Object.values(require('./billing/routes'))
];
