'use strict';
/*
API page, pending real back end - uses fs to read and write to lkocal json files...
*/
const sessionRoutes = require('../controllers/sessions');
const notificationsRoutes = require('../controllers/notifications');
const eventsRoutes = require('../controllers/events');
const notifyTemplatesRoutes = require('../controllers/notifytemplates');
const taskConfigRoutes = require('../controllers/task-config');
const moduleRoutes = require('../modules/routes');
const arAnalysisLicencesRoutes = require('../controllers/ar-analysis-licences');

const pkg = require('../../package.json');
const { version } = pkg;

module.exports = [
  ...sessionRoutes,
  ...eventsRoutes,
  ...notificationsRoutes,
  ...notifyTemplatesRoutes,
  ...taskConfigRoutes,
  ...moduleRoutes,
  ...arAnalysisLicencesRoutes,
  {
    method: 'GET',
    path: '/status',
    handler: () => ({ version }),
    config: { auth: false, description: 'Check service status' }
  }
];
