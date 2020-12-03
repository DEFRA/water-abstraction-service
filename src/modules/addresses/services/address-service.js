const crmAddressConnector = require('../../../lib/connectors/crm-v2/addresses');
const addressMapper = require('../../../lib/mappers/address');

const mapAddress = address => addressMapper.crmToModel(address);

const create = async address => {
  const createdAddress = await crmAddressConnector.createAddress(address);
  return mapAddress(createdAddress);
};

exports.create = create;
exports.mapAddress = mapAddress;
