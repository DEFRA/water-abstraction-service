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

/**
 * Creates an address
 * If there is a 409 error because the address already exists, this is handled
 * and the existing address is returned
 * @param {Address} address
 * @return {Promise<Address>} the water service representation of the CRM persisted model
 */
const createAddress = async addressModel => {
  let address;
  try {
    address = await addressesConnector.createAddress(mappers.address.modelToCrm(addressModel));
  } catch (err) {
    console.log(err.statusCode);
    if (err.statusCode === 409 && err.error.existingEntity) {
      address = err.error.existingEntity;
    } else {
      throw err;
    }
  }
  console.log(addressModel);
  console.log(address);
  return mappers.address.crmToModel(address);
};

const deleteAddress = async address => addressesConnector.deleteAddress(address.id);

exports.getAddressModel = getAddressModel;
exports.createAddress = createAddress;
exports.deleteAddress = deleteAddress;
