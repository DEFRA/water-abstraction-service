/*
API page, pending real back end - uses fs to read and write to lkocal json files...
*/
const version = '1.0';
const Nald = require('../lib/nald');
const sessionRoutes = require('../controllers/sessions');
const schedulerRoutes = require('../controllers/scheduler');
const lookupRoutes = require('../controllers/lookup');
const notificationsRoutes = require('../controllers/notifications');
const eventsRoutes = require('../controllers/events');
const notifyTemplatesRoutes = require('../controllers/notifytemplates');
const importedLicencesRoutes = require('../controllers/imported_licences');
const taskRunner = require('../controllers/taskRunner');
const taskConfigRoutes = require('../controllers/task-config');

const moduleRoutes = require('../modules/routes');

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
  { method: 'GET', path: '/status', handler: function (request, reply) { return reply('ok').code(200); }, config: { auth: false, description: 'Get all entities' } },
  { method: 'GET', path: '/water/' + version + '/nald/import', handler: Nald.import, config: { auth: false, description: 'Import nald from s3 data' } },
  { method: 'GET', path: '/water/' + version + '/nald/import/test', handler: Nald.importTest, config: { auth: false, description: 'Test import dummy nald data' } },
  { method: 'POST', path: '/water/' + version + '/nald/licence', handler: Nald.getLicence, config: { auth: false, description: 'Fetch legacy nald licence' } }
];

// start node cron
const cron = require('node-cron');

taskRunner.reset();
cron.schedule('*/5 * * * * * *', function () {
  taskRunner.run();
});
