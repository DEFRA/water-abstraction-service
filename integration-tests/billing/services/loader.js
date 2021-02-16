const crmLoader = require('../services/crm-loader')();
const idmLoader = require('../services/idm-loader')();
const waterLoader = require('../services/water-loader')();

const loaders = {
  crm: crmLoader,
  idm: idmLoader,
  water: waterLoader
};

const load = async (service, file) => {
  await loaders[service].load(file);
};

exports.load = load;
