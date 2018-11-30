'use strict';
/*
API page, pending real back end - uses fs to read and write to lkocal json files...
*/
const sessionRoutes = require('../controllers/sessions');
const schedulerRoutes = require('../controllers/scheduler');
const lookupRoutes = require('../controllers/lookup');
const notificationsRoutes = require('../controllers/notifications');
const eventsRoutes = require('../controllers/events');
const notifyTemplatesRoutes = require('../controllers/notifytemplates');
const importedLicencesRoutes = require('../controllers/imported_licences');
const taskRunner = require('../controllers/taskRunner');
const taskConfigRoutes = require('../controllers/task-config');
const gaugingStationRoutes = require('../controllers/gauging-stations');
const picklistRoutes = require('../controllers/picklists');
const picklistItemRoutes = require('../controllers/picklist-items');
const moduleRoutes = require('../modules/routes');
const arAnalysisLicencesRoutes = require('../controllers/ar-analysis-licences');

module.exports = [
  ...sessionRoutes,
  ...schedulerRoutes,
  ...eventsRoutes,
  ...notificationsRoutes,
  ...notifyTemplatesRoutes,
  ...importedLicencesRoutes,
  ...lookupRoutes,
  ...taskConfigRoutes,
  ...moduleRoutes,
  ...gaugingStationRoutes,
  ...picklistRoutes,
  ...picklistItemRoutes,
  ...arAnalysisLicencesRoutes,
  {
    method: 'GET',
    path: '/status',
    handler: function (request, h) {
      return 'ok';
    },
    config: { auth: false, description: 'Check service status' }
  }
];

// start node cron
const cron = require('node-cron');

taskRunner.reset();
cron.schedule('*/5 * * * * * *', function () {
  taskRunner.run();
});
