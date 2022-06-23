'use strict'

const addressService = require('../../lib/services/addresses-service')
const addressMapper = require('../../lib/mappers/address')
const { logger } = require('../../logger')
const mapErrorResponse = require('../../lib/map-error-response')

const postAddress = async request => {
  const { email } = request.defra.internalCallingUser
  try {
    const model = addressMapper.uiToModel(request.payload)
    return await addressService.createAddress(model, email)
  } catch (err) {
    logger.error('Error creating address', err)
    return mapErrorResponse(err)
  }
}

exports.postAddress = postAddress
