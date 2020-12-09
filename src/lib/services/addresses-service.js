const addressesConnector = require('../connectors/crm-v2/addresses');
const mappers = require('../mappers');
const { InvalidEntityError } = require('../errors');

const getAddressModel = address => {
  const addressModel = mappers.address.uiToModel(address);
  if (!addressModel.id) {
    const { error } = addressModel.validate();
    if (error) throw new InvalidEntityError('Invalid address', error);
  };
  return addressModel;
};

const createAddress = async addressModel => {
  const address = await addressesConnector.createAddress(mappers.address.modelToCrm(addressModel));
  return mappers.address.crmToModel(address);
};

const deleteAddress = async address => addressesConnector.deleteAddress(address.id);

exports.getAddressModel = getAddressModel;
exports.createAddress = createAddress;
exports.deleteAddress = deleteAddress;
