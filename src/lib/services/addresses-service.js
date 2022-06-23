const addressesConnector = require('../connectors/crm-v2/addresses')
const mappers = require('../mappers')
const { InvalidEntityError } = require('../errors')
const eventService = require('./events')
const Event = require('../models/event')
const { getExistingEntity } = require('../crm-response')

const getAddressModel = address => {
  const addressModel = mappers.address.uiToModel(address)
  if (!addressModel.id) {
    const { error } = addressModel.validate()
    if (error) throw new InvalidEntityError('Invalid address', error)
  };
  return addressModel
}

/**
 * Creates an event when an address is stored
 * @param {Object} address - CRM address data
 * @param {String} issuer - email address
 * @return {Promise}
 */
const createAddressEvent = (address, issuer) => {
  const event = new Event().fromHash({
    issuer,
    type: 'address:create',
    metadata: { address },
    status: 'created'
  })
  return eventService.create(event)
}

/**
 * Creates an address
 * If there is a 409 error because the address already exists, this is handled
 * and the existing address is returned
 * @param {Address} address
 * @param {String} [issuer]
 * @return {Promise<Address>} the water service representation of the CRM persisted model
 */
const createAddress = async (addressModel, issuer) => {
  let address
  try {
    address = await addressesConnector.createAddress(mappers.address.modelToCrm(addressModel))
    if (issuer) {
      await createAddressEvent(address, issuer)
    }
  } catch (err) {
    address = getExistingEntity(err)
  }
  return mappers.address.crmToModel(address)
}

const deleteAddress = async address => addressesConnector.deleteAddress(address.id)

exports.getAddressModel = getAddressModel
exports.createAddress = createAddress
exports.deleteAddress = deleteAddress
