const addressService = require('./services/address-service');
const helpers = require('./lib/helpers');

const postAddress = async request => {
  const { email } = request.defra.internalCallingUser;
  try {
    const address = await addressService.create(request.payload);

    await helpers.createAddressEvent({
      issuer: email,
      address
    });

    return address;
  } catch (err) {
    if (err.statusCode === 409 && err.error.existingEntity) {
      return addressService.mapAddress(err.error.existingEntity);
    }
    throw err;
  }
};

exports.postAddress = postAddress;
