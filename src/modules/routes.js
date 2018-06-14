const notificationsRoutes = require('./notifications/routes');
const riverLevelsRoutes = require('./river-levels/routes');
const notifyRoutes = require('./notify/routes');

module.exports = [
  ...Object.values(notificationsRoutes),
  ...Object.values(notifyRoutes),
  ...Object.values(riverLevelsRoutes)
];
