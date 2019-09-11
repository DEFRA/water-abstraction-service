const notificationsRoutes = require('./notifications/routes');
const riverLevelsRoutes = require('./river-levels/routes');
const notifyRoutes = require('./notify/routes');
const importRoutes = require('./import/routes');
const returnsRoutes = require('./returns/routes');
const pdfNotificationRoutes = require('./pdf-notifications/routes');
const returnsNotificationRoutes = require('./returns-notifications/routes');
const arAnalysisRoutes = require('./ar-analysis/routes');
const licenceRoutes = require('./licences/routes');
const internalSearch = require('./internal-search/routes');
const usersRoutes = require('./users/routes');
const communicationsRoutes = require('./communications/routes');
const batchNotificationsRoutes = require('./batch-notifications/routes');
const companiesRoutes = require('./companies/routes');
const serviceStatusRoutes = require('./service-status/routes');
const changeEmailRoutes = require('./change-email/routes');
const chargeVersionRoutes = require('./charge-versions/routes');
const unlinkLicenceRoutes = require('./unlink-licence/routes');

module.exports = [
  ...Object.values(notificationsRoutes),
  ...Object.values(notifyRoutes),
  ...Object.values(riverLevelsRoutes),
  ...Object.values(importRoutes),
  ...Object.values(returnsRoutes),
  ...Object.values(pdfNotificationRoutes),
  ...Object.values(returnsNotificationRoutes),
  ...Object.values(arAnalysisRoutes),
  ...Object.values(licenceRoutes),
  ...Object.values(internalSearch),
  ...Object.values(usersRoutes),
  ...Object.values(communicationsRoutes),
  ...Object.values(batchNotificationsRoutes),
  ...Object.values(companiesRoutes),
  ...Object.values(serviceStatusRoutes),
  ...Object.values(changeEmailRoutes),
  ...Object.values(chargeVersionRoutes),
  ...Object.values(unlinkLicenceRoutes)
];
