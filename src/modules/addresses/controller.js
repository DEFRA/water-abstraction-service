const addressService = require('../../lib/services/addresses-service');
const addressMapper = require('../../lib/mappers/address');
const helpers = require('./lib/helpers');

const postAddress = async request => {
  const { email } = request.defra.internalCallingUser;
  try {
    const address = await addressService.createAddress(addressMapper.uiToModel(request.payload));

    await helpers.createAddressEvent({
      issuer: email,
      address
    });

    return address;
  } catch (err) {
    if (err.statusCode === 409 && err.error.existingEntity) {
      return addressMapper.crmToModel(err.error.existingEntity);
    }
    throw err;
  }
};

exports.postAddress = postAddress;
