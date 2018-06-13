const notificationsRoutes = require('./notifications/routes');
const notifyRoutes = require('./notify/routes');

module.exports = [
  ...Object.values(notificationsRoutes),
  ...Object.values(notifyRoutes)
];
