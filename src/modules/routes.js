const notificationsRoutes = require('./notifications/routes');
const riverLevelsRoutes = require('./river-levels/routes');
const notifyRoutes = require('./notify/routes');
const importRoutes = require('./import/routes');
const returnsRoutes = require('./returns/routes');
const pdfNotificationRoutes = require('./pdf-notifications/routes');
const returnsNotificationRoutes = require('./returns-notifications/routes');

module.exports = [
  ...Object.values(notificationsRoutes),
  ...Object.values(notifyRoutes),
  ...Object.values(riverLevelsRoutes),
  ...Object.values(importRoutes),
  ...Object.values(returnsRoutes),
  ...Object.values(pdfNotificationRoutes),
  ...Object.values(returnsNotificationRoutes)
];
