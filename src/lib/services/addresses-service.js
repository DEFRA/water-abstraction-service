const addressesConnector = require('../connectors/crm-v2/addresses');
const mappers = require('../mappers');

const createAddress = async addressData => {
  const address = await addressesConnector.createAddress(mappers.address.serviceToCrm(addressData));
  return mappers.address.crmToModel(address);
};

exports.createAddress = createAddress;
