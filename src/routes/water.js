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
const notifyController = require('../controllers/notify');
// const sendNotificationController = require('../controllers/send-notification');
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
  // { method: 'POST', path: '/water/' + version + '/notification/send', handler: sendNotificationController.send, config: { description: 'Send notification' } },
  { method: 'GET', path: '/status', handler: function (request, reply) { return reply('ok').code(200); }, config: { auth: false, description: 'Get all entities' } },
  { method: 'GET', path: '/water/' + version + '/nald/import', handler: Nald.import, config: { auth: false, description: 'Import nald from s3 data' } },
  { method: 'GET', path: '/water/' + version + '/nald/import/test', handler: Nald.importTest, config: { auth: false, description: 'Test import dummy nald data' } },

  { method: 'POST', path: '/water/' + version + '/nald/licence', handler: Nald.getLicence, config: { auth: false, description: 'Fetch legacy nald licence' } },
  { method: 'POST', path: '/water/' + version + '/notify/{message_ref}', handler: notifyController.send, config: { description: 'Send a notify message' } },
  { method: 'POST', path: '/water/' + version + '/notifyLater/{message_ref}', handler: notifyController.futureSend, config: { description: 'Send a notify message later' } }
];

// start node cron
const cron = require('node-cron');
const IDM = require('../lib/connectors/idm');
const Slack = require('../lib/slack');
cron.schedule('0 8,10,17 * * *', function () {
  console.log('running a task now and again...');
  users();
});

taskRunner.reset();

cron.schedule('*/5 * * * * * *', function () {
  taskRunner.run();
});

function users () {
  IDM.getUsers().then((users) => {
    const stats = { loggedin: { users: [], domains: [] }, notloggedin: { users: [], domains: [] } };
    for (let userRef in users) {
      var user = users[userRef];
      let status;
      if (user.last_login != null) {
        status = 'loggedin';
      } else {
        status = 'notloggedin';
      }
      stats[status].users.push(user.user_name);
      var domain = user.user_name.split('@')[1].trim();
      if (!stats[status][domain]) {
        stats[status].domains[domain] = [user.user_name];
      }
      stats[status].domains[domain].push();
      //      console.log(user.last_login, domain)
    }
    //    console.log(stats)

    let report = `Login Activity Summary (${process.env.environment})`;
    for (let type in stats) {
      report += `\n\n ${type}`;
      //      console.log(type)
      for (domain in stats[type].domains) {
        report += `\n\t@${domain}: ${domain.length}`;
        //          console.log(domain,domain.length)
      }
    }

    Slack.post(report).then(() => {
      console.log('slack posted');
    }).catch((err) => {
      console.log(err);
    });
    console.log(report);
  });
}
