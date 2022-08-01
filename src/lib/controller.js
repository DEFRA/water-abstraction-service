'use strict'

const Boom = require('@hapi/boom')
const mapErrorResponse = require('./map-error-response')

/**
 * Gets an entity via a service layer function, and either returns it if present,
 * or returns a Not Found error object. Suitable in simple controller handlers
 * where no extra logic is applied.
 *
 * @param {*} id
 * @param {Function} serviceFunc The service layer function that will retrieve the entity
 */
const getEntity = async (id, serviceFunc) => {
  const entity = await serviceFunc(id)
  return entity || Boom.notFound(`Entity ${id} not found`, { id })
}

/**
 * Gets an array of entities via a service layer function, and returns
 * the array of results in a data envelope. Suitable in simple controller
 * handlers where no extra logic is applied.
 *
 * @param {*} id
 * @param {Function} serviceFunc The service layer function that will retrieve the array of entities
 * @param {Function} [rowMapper] optional mapper for each data row
 */
const getEntities = async (id, serviceFunc, rowMapper) => {
  const entities = await serviceFunc(id)
  return { data: rowMapper ? entities.map(rowMapper) : entities }
}

/**
 * Deletes an entity via a service function
 *
 * @param {Function} serviceFunc - the service layer function that will delete the entity
 * @param {Object} h - hapi response toolkit
 * @param {String} id - id
 */
const deleteEntity = async (serviceFunc, h, ...args) => {
  try {
    await serviceFunc(...args)
    return h.response().code(204)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

exports.getEntities = getEntities
exports.getEntity = getEntity
exports.deleteEntity = deleteEntity
