const Joi = require('joi');
const controllers = require('./controllers');

const BASE_PATH = '/water/1.0/gauging-stations';

const getGaugingStation = {
  method: 'GET',
  path: `${BASE_PATH}/{stationGuid}`,
  handler: controllers.getGaugingStation,
  config: {
    validate: {
      params: Joi.object({
        stationGuid: Joi.string().uuid().required()
      })
    }
  }
};

module.exports = {
  getGaugingStation
};
