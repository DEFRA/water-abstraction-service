const notificationsRoutes = require('./notifications/routes');
const riverLevelsRoutes = require('./river-levels/routes');
const notifyRoutes = require('./notify/routes');
const importRoutes = require('./import/routes');

module.exports = [
  ...Object.values(notificationsRoutes),
  ...Object.values(notifyRoutes),
  ...Object.values(riverLevelsRoutes),
  ...Object.values(importRoutes)
];
