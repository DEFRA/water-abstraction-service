const controller = require('./controller');
const version = '1.0';

module.exports = {
  getLicence: {
    method: 'GET',
    path: '/water/' + version + '/nald/licence',
    handler: controller.getLicence,
    config: { description: 'Get a licence by licence number' }
  }
};
