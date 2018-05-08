const notificationsRoutes = require('./notifications/routes');

module.exports = [
  ...Object.values(notificationsRoutes)
];
