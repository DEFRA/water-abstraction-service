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
  },

  getFormats: {
    method: 'GET',
    path: '/water/' + version + '/nald/returns/formats',
    handler: controller.getReturnsFormats,
    config: { description: 'Gets a returns formats for given licence number' }
  },

  getLogs: {
    method: 'GET',
    path: '/water/' + version + '/nald/returns/logs',
    handler: controller.getReturnsLogs,
    config: { description: 'Gets a returns logs for given format' }
  },

  getLogLines: {
    method: 'GET',
    path: '/water/' + version + '/nald/returns/lines',
    handler: controller.getReturnsLogLines,
    config: { description: 'Gets a returns lines for a given log' }
  }
};
