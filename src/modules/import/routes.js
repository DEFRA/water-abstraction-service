const controller = require('./controller');
const version = '1.0';

module.exports = {
  getLicence: {
    method: 'GET',
    path: '/water/' + version + '/nald/licence',
    handler: controller.getLicence,
    config: { description: 'Get permit repo packet by licence number' }
  },

  getReturns: {
    method: 'GET',
    path: '/water/' + version + '/nald/returns',
    handler: controller.getReturns,
    config: { description: 'Get a returns data packet by licence number' }
  }
};
