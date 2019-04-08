
const Joi = require('joi');

const schema = {
  endDate: Joi.string().isoDate().required()
};

const getRecipients = async (messageConfig) => {

};

module.exports = {
  prefix: 'RREM-',
  name: 'Returns: reminder',
  schema,
  getRecipients
};
