const crmLoader = require('../services/crm-loader')();
const idmLoader = require('../services/idm-loader')();
const waterLoader = require('../services/water-loader')();
const permitsLoader = require('../services/permits-loader')();

const loaders = {
  crm: crmLoader,
  idm: idmLoader,
  water: waterLoader,
  permits: permitsLoader
};

const load = async (service, file) => {
  console.log(`Loading ${file} from ${service}`);
  await loaders[service].load(file);
};

exports.load = load;
