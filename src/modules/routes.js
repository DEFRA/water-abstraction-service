const notificationsRoutes = require('./notifications/routes');
const riverLevelsRoutes = require('./river-levels/routes');

module.exports = [
  ...Object.values(notificationsRoutes),
  ...Object.values(riverLevelsRoutes)
];
